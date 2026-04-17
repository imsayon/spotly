import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import type { Merchant } from '@spotly/types';

@Injectable()
export class IntegrationService {
  private readonly logger = new Logger(IntegrationService.name);

  /**
   * Geocode a location string into coordinates using Nominatim
   */
  async geocode(query: string): Promise<{ lat: number; lon: number; displayName: string } | null> {
    this.logger.log(`Geocoding query: ${query}`);
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: query,
          format: 'json',
          limit: 1,
        },
        headers: {
          'User-Agent': 'SpotlyDemoApp/1.0',
        },
      });

      if (response.data && response.data.length > 0) {
        const item = response.data[0];
        const result = {
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          displayName: item.display_name,
        };
        this.logger.log(`Geocoding result found: ${result.displayName} (${result.lat}, ${result.lon})`);
        return result;
      }
      this.logger.warn(`No geocoding results for: ${query}`);
      return null;
    } catch (error) {
      this.logger.error(`Geocoding failed for ${query}:`, error);
      return null;
    }
  }

  /**
   * Fetch nearby shops using Overpass API or fallback to mock data
   */
  async fetchShops(lat: number, lon: number, radius = 5000, category?: string): Promise<Merchant[]> {
    this.logger.log(`Fetching shops at (${lat}, ${lon}) with radius ${radius}m`);
    try {
      if (process.env.ENABLE_DEMO_MERCHANTS === 'false') return [];
      
      // Use mock data while external APIs are down
      const mockData = this.generateMockPlaces(lat, lon, category, radius);
      if (mockData.length > 0) {
        this.logger.log(`Returning ${mockData.length} nearby places for area`);
        return mockData;
      }

      const categoryQuery = this.resolveCategoryQuery(category, radius, lat, lon);
      const query = `
        [out:json][timeout:25];
        (
          ${categoryQuery ?? `
          nwr["shop"](around:${radius},${lat},${lon});
          nwr["amenity"~"restaurant|cafe|pharmacy|post_office|bank|hospital|fast_food|bar|pub|cinema"](around:${radius},${lat},${lon});
          `}
        );
        out body center;
      `;

      const response = await axios.post(
        'https://overpass-api.de/api/interpreter',
        new URLSearchParams({ data: query }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          },
          timeout: 15000,
        },
      );

      if (!response.data || !response.data.elements) {
        this.logger.warn(`No OSM elements found at (${lat}, ${lon})`);
        return [];
      }

      const elements = response.data.elements.filter((el: any) => el.tags && el.tags.name);
      this.logger.log(`OSM Elements found: ${elements.length}`);

      return elements
        .slice(0, 20) // Limit to 20 results for the demo
        .map((el: any) => {
          const tags = el.tags;
          const category = tags.shop || tags.amenity || 'Outlet';
          
          return {
            id: `osm-${el.id}`,
            ownerId: 'system',
            name: tags.name,
            category: this.formatCategory(category),
            location: tags['addr:city'] || tags['addr:suburb'] || tags['addr:neighbourhood'] || 'Nearby',
            rating: parseFloat((4 + Math.random()).toFixed(1)), // Simulated rating
            estimatedWaitTime: `${Math.floor(Math.random() * 20) + 10} MIN`, // Simulated wait time
            createdAt: new Date().toISOString(),
          } as Merchant;
        });
    } catch (error) {
      this.logger.error('OSM Fetch failed:', error);
      return [];
    }
  }

  private formatCategory(raw: string): string {
    const mapping: Record<string, string> = {
      supermarket: 'Groceries',
      bakery: 'Bakery',
      pharmacy: 'Pharmacy',
      restaurant: 'Restaurant',
      cafe: 'Coffee Shop',
      convenience: 'Groceries',
      clothes: 'Retail',
      fast_food: 'Restaurant',
      bank: 'Finance',
      hospital: 'Health',
    };
    return mapping[raw] || raw.charAt(0).toUpperCase() + raw.slice(1).replace('_', ' ');
  }

  private resolveCategoryQuery(category: string | undefined, radius: number, lat: number, lon: number): string | null {
    if (!category || category.toLowerCase() === 'all') {
      return null;
    }

    const normalized = category.toLowerCase();
    const filters: Record<string, string> = {
      groceries: `nwr["shop"~"supermarket|convenience|greengrocer|bakery"](around:${radius},${lat},${lon});`,
      bakery: `nwr["shop"="bakery"](around:${radius},${lat},${lon});`,
      pharmacy: `nwr["amenity"="pharmacy"](around:${radius},${lat},${lon});`,
      restaurant: `nwr["amenity"~"restaurant|cafe|fast_food|bar|pub"](around:${radius},${lat},${lon});`,
      retail: `nwr["shop"](around:${radius},${lat},${lon});`,
      finance: `nwr["amenity"="bank"](around:${radius},${lat},${lon});`,
      health: `nwr["amenity"~"hospital|clinic|doctors|dentist|pharmacy"](around:${radius},${lat},${lon});`,
      'coffee shop': `nwr["amenity"="cafe"](around:${radius},${lat},${lon});`,
    };

    return filters[normalized] ?? null;
  }

  private generateMockPlaces(lat: number, lon: number, category?: string, radius = 5000): Merchant[] {
    // Generate area-specific seed for consistent results based on coordinates
    const areaSeed = Math.round((lat + lon) * 10000) % 1000;
    const categoryNorm = category?.toLowerCase() || 'all';

    const templates: Record<string, { name: string; suffix: string[] }> = {
      groceries: {
        name: 'Fresh & Go',
        suffix: ['Supermarket', 'Market', 'Co-op', 'Whole Foods', 'Trader Joe\'s'],
      },
      bakery: {
        name: 'The Bakery',
        suffix: ['Artisan', 'Craft', 'Daily', 'Sweet', 'Sourdough'],
      },
      pharmacy: {
        name: 'Care',
        suffix: ['Pharmacy', 'Rx Center', 'Clinical', 'Health+', 'Medical'],
      },
      restaurant: {
        name: 'Local',
        suffix: ['Eatery', 'Table', 'Bistro', 'Grill', 'Kitchen'],
      },
      retail: {
        name: 'Shop',
        suffix: ['House', 'Store', 'Center', 'Gallery', 'Boutique'],
      },
      'coffee shop': {
        name: 'Brew',
        suffix: ['Cafe', 'Coffee Co', 'Espresso Bar', 'Roastery', 'Cup'],
      },
      finance: {
        name: 'Metro',
        suffix: ['Bank', 'Credit Union', 'Financial', 'Savings', 'Trust'],
      },
      health: {
        name: 'City',
        suffix: ['Medical', 'Clinic', 'Hospital', 'Care Center', 'Urgent Care'],
      },
    };

    let activeTemplates: Array<{ key: string; tmpl: typeof templates[string] }> = [];
    if (categoryNorm === 'all') {
      activeTemplates = Object.entries(templates)
        .slice(0, 3)
        .map(([k, v]) => ({ key: k, tmpl: v }));
    } else if (templates[categoryNorm]) {
      activeTemplates = [{ key: categoryNorm, tmpl: templates[categoryNorm] }];
    }

    if (activeTemplates.length === 0) return [];

    const places: Merchant[] = [];
    activeTemplates.forEach((group, idx) => {
      const count = (areaSeed * (idx + 1)) % 5 + 2; // 2-6 places per category
      for (let i = 0; i < count; i++) {
        const seedVal = areaSeed + idx * 100 + i;
        const suffixIdx = seedVal % group.tmpl.suffix.length;
        const placeName = `${group.tmpl.name} ${group.tmpl.suffix[suffixIdx]} #${seedVal % 100}`;

        places.push({
          id: `demo-${areaSeed}-${idx}-${i}`,
          ownerId: 'system',
          name: placeName,
          category: group.key === 'coffee shop' ? 'Coffee Shop' : group.key.charAt(0).toUpperCase() + group.key.slice(1),
          location: 'Nearby',
          rating: parseFloat((3.8 + (seedVal % 20) * 0.1).toFixed(1)),
          estimatedWaitTime: `${(seedVal % 25) + 5} MIN`,
          currentQueueDepth: seedVal % 15,
          createdAt: new Date().toISOString(),
          // Add a default outlet for maps
          outlets: [
            {
              id: `demo-outlet-${areaSeed}-${idx}-${i}`,
              merchantId: `demo-${areaSeed}-${idx}-${i}`,
              name: 'Main Branch',
              address: 'Downtown Street',
              lat: lat + (Math.random() - 0.5) * 0.02,
              lng: lon + (Math.random() - 0.5) * 0.02,
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          ]
        } as any);
      }
    });

    return places.slice(0, 20);
  }
}
