import { supabase } from '../lib/supabase';

interface WasteRecord {
  id: string;
  project_id: string;
  material_id: string;
  quantity: number;
  waste_type: string;
  recyclable: boolean;
  disposal_cost: number;
  recycling_savings: number;
  recorded_at: string;
}

interface SustainabilityMetrics {
  id: string;
  project_id: string;
  total_waste_volume: number;
  recycled_percentage: number;
  cost_savings: number;
  carbon_footprint: number;
  report_date: string;
}

export class MaterialWasteService {
  async recordWaste(
    projectId: string,
    materialId: string,
    quantity: number,
    wasteType: string,
    recyclable: boolean
  ): Promise<{ record: WasteRecord | null; error: Error | null }> {
    try {
      const disposalCost = await this.calculateDisposalCost(quantity, wasteType);
      const recyclingSavings = recyclable ? await this.calculateRecyclingSavings(quantity, wasteType) : 0;

      const { data, error } = await supabase
        .from('waste_records')
        .insert({
          project_id: projectId,
          material_id: materialId,
          quantity,
          waste_type: wasteType,
          recyclable,
          disposal_cost: disposalCost,
          recycling_savings: recyclingSavings
        })
        .select()
        .single();

      if (error) throw error;

      return { record: data, error: null };
    } catch (error) {
      return { record: null, error: error as Error };
    }
  }

  private async calculateDisposalCost(quantity: number, wasteType: string): Promise<number> {
    // In a real implementation, this would use actual disposal rates
    const disposalRates: { [key: string]: number } = {
      'concrete': 50, // per ton
      'wood': 30,
      'metal': 20,
      'plastic': 40,
      'mixed': 60
    };

    const rate = disposalRates[wasteType.toLowerCase()] || disposalRates['mixed'];
    return quantity * rate;
  }

  private async calculateRecyclingSavings(quantity: number, wasteType: string): Promise<number> {
    // In a real implementation, this would use actual recycling rates and market values
    const recyclingRates: { [key: string]: number } = {
      'concrete': 20, // savings per ton
      'wood': 15,
      'metal': 100,
      'plastic': 30,
      'mixed': 10
    };

    const rate = recyclingRates[wasteType.toLowerCase()] || recyclingRates['mixed'];
    return quantity * rate;
  }

  async getProjectWasteRecords(projectId: string): Promise<WasteRecord[]> {
    const { data, error } = await supabase
      .from('waste_records')
      .select(`
        *,
        materials (name)
      `)
      .eq('project_id', projectId)
      .order('recorded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async calculateSustainabilityMetrics(projectId: string): Promise<SustainabilityMetrics> {
    const wasteRecords = await this.getProjectWasteRecords(projectId);
    
    const totalWaste = wasteRecords.reduce((sum, record) => sum + record.quantity, 0);
    const recycledWaste = wasteRecords
      .filter(record => record.recyclable)
      .reduce((sum, record) => sum + record.quantity, 0);
    
    const recycledPercentage = (recycledWaste / totalWaste) * 100;
    const costSavings = wasteRecords.reduce((sum, record) => sum + record.recycling_savings, 0);
    
    // Calculate carbon footprint (simplified)
    const carbonFootprint = await this.calculateCarbonFootprint(wasteRecords);

    const metrics: Omit<SustainabilityMetrics, 'id'> = {
      project_id: projectId,
      total_waste_volume: totalWaste,
      recycled_percentage: recycledPercentage,
      cost_savings: costSavings,
      carbon_footprint: carbonFootprint,
      report_date: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('sustainability_metrics')
      .insert(metrics)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async calculateCarbonFootprint(wasteRecords: WasteRecord[]): Promise<number> {
    // Carbon footprint factors (kg CO2 per ton of waste)
    const carbonFactors: { [key: string]: number } = {
      'concrete': 100,
      'wood': 50,
      'metal': 200,
      'plastic': 300,
      'mixed': 150
    };

    return wasteRecords.reduce((total, record) => {
      const factor = carbonFactors[record.waste_type.toLowerCase()] || carbonFactors['mixed'];
      return total + (record.quantity * factor);
    }, 0);
  }

  async getWasteReductionRecommendations(projectId: string): Promise<string[]> {
    const wasteRecords = await this.getProjectWasteRecords(projectId);
    const recommendations: string[] = [];

    // Analyze waste patterns
    const totalWaste = wasteRecords.reduce((sum, record) => sum + record.quantity, 0);
    const wasteByType = new Map<string, number>();
    
    wasteRecords.forEach(record => {
      wasteByType.set(
        record.waste_type,
        (wasteByType.get(record.waste_type) || 0) + record.quantity
      );
    });

    // Generate recommendations based on analysis
    for (const [type, amount] of wasteByType.entries()) {
      const percentage = (amount / totalWaste) * 100;
      
      if (percentage > 30) {
        recommendations.push(
          `High ${type} waste detected (${percentage.toFixed(1)}%). Consider implementing ${type}-specific reduction strategies.`
        );
      }
    }

    const recycledPercentage = wasteRecords
      .filter(record => record.recyclable)
      .reduce((sum, record) => sum + record.quantity, 0) / totalWaste * 100;

    if (recycledPercentage < 50) {
      recommendations.push('Increase recycling efforts to achieve industry standard of 50% recycling rate.');
    }

    const totalCost = wasteRecords.reduce((sum, record) => sum + record.disposal_cost, 0);
    if (totalCost > 10000) {
      recommendations.push('High disposal costs detected. Consider waste sorting and recycling program implementation.');
    }

    return recommendations;
  }
}

export const materialWasteService = new MaterialWasteService(); 