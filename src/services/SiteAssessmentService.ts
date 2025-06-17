import { supabase } from '../lib/supabase';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface AccessRoute {
  name: string;
  width: number;
  height_clearance: number;
  weight_limit: number;
  restrictions: string[];
}

interface SiteAssessment {
  id: string;
  project_id: string;
  location_coordinates: Coordinates;
  terrain_type: 'flat' | 'sloped' | 'rocky' | 'wetland';
  soil_condition: string;
  access_routes: AccessRoute[];
  parking_space: number;
  storage_space: number;
  site_photos: string[];
  assessment_date: string;
}

interface TerrainAnalysis {
  slope_percentage: number;
  soil_type: string;
  drainage_quality: 'poor' | 'fair' | 'good';
  foundation_recommendation: string;
}

export class SiteAssessmentService {
  private readonly MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

  async createSiteAssessment(
    projectId: string,
    coordinates: Coordinates,
    terrainType: SiteAssessment['terrain_type'],
    soilCondition: string,
    accessRoutes: AccessRoute[],
    parkingSpace: number,
    storageSpace: number,
    sitePhotos: string[]
  ): Promise<{ assessment: SiteAssessment | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('site_assessments')
        .insert({
          project_id: projectId,
          location_coordinates: `(${coordinates.latitude},${coordinates.longitude})`,
          terrain_type: terrainType,
          soil_condition: soilCondition,
          access_routes: accessRoutes,
          parking_space: parkingSpace,
          storage_space: storageSpace,
          site_photos: sitePhotos,
          assessment_date: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return { assessment: data, error: null };
    } catch (error) {
      return { assessment: null, error: error as Error };
    }
  }

  async getSiteAssessment(projectId: string): Promise<SiteAssessment | null> {
    const { data, error } = await supabase
      .from('site_assessments')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error) throw error;
    return data;
  }

  async analyzeTerrain(coordinates: Coordinates): Promise<TerrainAnalysis> {
    try {
      // In a real implementation, this would use Google Maps Elevation API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/elevation/json?locations=${coordinates.latitude},${coordinates.longitude}&key=${this.MAPS_API_KEY}`
      );
      const data = await response.json();

      // Mock terrain analysis
      const analysis: TerrainAnalysis = {
        slope_percentage: this.calculateSlope(data),
        soil_type: await this.determineSoilType(coordinates),
        drainage_quality: await this.assessDrainageQuality(coordinates),
        foundation_recommendation: await this.generateFoundationRecommendation(coordinates)
      };

      return analysis;
    } catch (error) {
      console.error('Error analyzing terrain:', error);
      throw error;
    }
  }

  private calculateSlope(elevationData: any): number {
    // In a real implementation, this would calculate slope from elevation data
    return Math.random() * 15; // Mock slope percentage
  }

  private async determineSoilType(coordinates: Coordinates): Promise<string> {
    // In a real implementation, this would use soil survey data
    const soilTypes = ['Clay', 'Sandy', 'Loamy', 'Rocky', 'Silty'];
    return soilTypes[Math.floor(Math.random() * soilTypes.length)];
  }

  private async assessDrainageQuality(coordinates: Coordinates): Promise<'poor' | 'fair' | 'good'> {
    // In a real implementation, this would analyze topography and soil data
    const qualities = ['poor', 'fair', 'good'] as const;
    return qualities[Math.floor(Math.random() * qualities.length)];
  }

  private async generateFoundationRecommendation(coordinates: Coordinates): Promise<string> {
    // In a real implementation, this would be based on actual soil and slope analysis
    const recommendations = [
      'Standard strip foundation suitable for soil conditions',
      'Deep foundations recommended due to soil instability',
      'Raft foundation advised for even load distribution',
      'Pile foundation necessary due to weak soil bearing capacity'
    ];
    return recommendations[Math.floor(Math.random() * recommendations.length)];
  }

  async planAccessRoutes(coordinates: Coordinates): Promise<AccessRoute[]> {
    try {
      // In a real implementation, this would use Google Maps Directions API
      // to find suitable routes for construction vehicles
      const mockRoutes: AccessRoute[] = [
        {
          name: 'Main Access Road',
          width: 6.5,
          height_clearance: 4.5,
          weight_limit: 40000,
          restrictions: []
        },
        {
          name: 'Secondary Access',
          width: 4.2,
          height_clearance: 3.8,
          weight_limit: 20000,
          restrictions: ['No overnight parking', 'Residential area']
        }
      ];

      return mockRoutes;
    } catch (error) {
      console.error('Error planning access routes:', error);
      throw error;
    }
  }

  async calculateRequiredSpace(projectSpecs: {
    buildingFootprint: number;
    materialStorage: number;
    equipmentArea: number;
    workerFacilities: number;
  }): Promise<{
    totalRequired: number;
    breakdown: { [key: string]: number };
    recommendations: string[];
  }> {
    const { buildingFootprint, materialStorage, equipmentArea, workerFacilities } = projectSpecs;
    
    // Add buffer zones and circulation space
    const bufferZone = buildingFootprint * 0.2;
    const circulationSpace = (materialStorage + equipmentArea) * 0.3;
    
    const totalRequired = buildingFootprint + materialStorage + equipmentArea + 
                         workerFacilities + bufferZone + circulationSpace;

    const breakdown = {
      buildingFootprint,
      materialStorage,
      equipmentArea,
      workerFacilities,
      bufferZone,
      circulationSpace
    };

    const recommendations = this.generateSpaceRecommendations(breakdown, totalRequired);

    return {
      totalRequired,
      breakdown,
      recommendations
    };
  }

  private generateSpaceRecommendations(
    breakdown: { [key: string]: number },
    totalSpace: number
  ): string[] {
    const recommendations: string[] = [];

    if (breakdown.materialStorage < totalSpace * 0.2) {
      recommendations.push('Consider increasing material storage area for efficient delivery scheduling');
    }

    if (breakdown.circulationSpace < totalSpace * 0.25) {
      recommendations.push('Increase circulation space to ensure safe vehicle and worker movement');
    }

    if (breakdown.bufferZone < totalSpace * 0.15) {
      recommendations.push('Expand buffer zone to minimize impact on neighboring properties');
    }

    return recommendations;
  }
}

export const siteAssessmentService = new SiteAssessmentService(); 