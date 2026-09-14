import { Controller, Get, Header, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { LocationService } from "./location.service";

@ApiTags("Location")
@Controller("location")
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get("reverse")
  @Header("Cache-Control", "private, max-age=300")
  @ApiOperation({ summary: "Resolve a coordinate to a short display label" })
  reverse(@Query("lat") latitude: string, @Query("lng") longitude: string) {
    return this.locationService.reverse(
      latitude?.trim() ? Number(latitude) : Number.NaN,
      longitude?.trim() ? Number(longitude) : Number.NaN,
    );
  }

  @Get("search")
  @Header("Cache-Control", "private, max-age=300")
  @ApiOperation({ summary: "Search for a place to use as a discovery center" })
  search(@Query("q") query: string) {
    return this.locationService.search(query);
  }
}
