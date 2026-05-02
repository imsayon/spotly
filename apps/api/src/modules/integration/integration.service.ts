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
   * Fetch nearby shops using Overpass API with empty-array fallback on error
   */
  async fetchShops(lat: number, lon: number, radius = 5000, category?: string): Promise<Merchant[]> {
    this.logger.log(`Fetching shops at (${lat}, ${lon}) with radius ${radius}m`);
    try {

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

      let response;
      try {
        response = await axios.post(
          'https://overpass-api.de/api/interpreter',
          new URLSearchParams({ data: query }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            },
            timeout: 15000,
          },
        );
      } catch (error) {
        this.logger.error('OSM fetch failed:', error);
        return [];
      }

      if (!response?.data || !response.data.elements) {
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
            userId: 'system',
            name: tags.name,
            category: this.formatCategory(category),
            location: tags['addr:city'] || tags['addr:suburb'] || tags['addr:neighbourhood'] || 'Nearby',
            address: [tags['addr:housenumber'], tags['addr:street'], tags['addr:suburb'], tags['addr:city']]
              .filter(Boolean)
              .join(', ') || undefined,
            lat: el.lat ?? el.center?.lat,
            lng: el.lon ?? el.center?.lon,
            rating: 4.5, // Default rating until reviews are implemented
            estimatedWaitTime: `15 MIN`, // Default wait time until queue size is calculated
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
}
