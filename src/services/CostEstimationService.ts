import { supabase } from '@/lib/supabase';
import { Material, Supplier, OptimizationResult } from '@/types';
import { analyzeWastagePatterns, findSubstituteMaterials, generateOptimizationRecommendations } from '@/services/MaterialService';

export interface MaterialTrend {
  materialId: string;
  materialName: string;
  currentPrice: number;
  predictedPrice: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  percentageChange: number;
}

export interface CostBreakdown {
  materialCosts: Record<string, number>;
  laborCosts: number;
  equipmentCosts: number;
  overheadCosts: number;
  contingency: number;
  totalCost: number;
}

export interface ProjectSpecs {
  area: number;
  floors: number;
  location: string;
  constructionType: string;
  quality: 'basic' | 'standard' | 'premium';
  timeline: number; // in months
}

export class CostEstimationService {
  private readonly LABOR_RATES = {
    basic: 25,
    standard: 35,
    premium: 50
  };

  private readonly EQUIPMENT_RATE_MULTIPLIER = 0.15;
  private readonly OVERHEAD_RATE = 0.1;
  private readonly CONTINGENCY_RATE = 0.05;

  async getPriceTrends(materialIds: string[]): Promise<MaterialTrend[]> {
    return materialIds.map((id) => ({
      materialId: id,
      materialName: `Mock Material ${id}`,
      currentPrice: Math.random() * 100,
      predictedPrice: Math.random() * 120,
      confidence: Math.random(),
      trend: 'increasing',
      percentageChange: Math.random() * 10,
    }));
  }

  async estimateProjectCost(specs: ProjectSpecs, materials: Record<string, number>): Promise<CostBreakdown> {
    const materialCosts = Object.keys(materials).reduce((acc, id) => {
      acc[id] = materials[id] * Math.random() * 100;
      return acc;
    }, {} as Record<string, number>);

    const laborCosts = specs.area * this.LABOR_RATES[specs.quality];
    const equipmentCosts = specs.area * this.EQUIPMENT_RATE_MULTIPLIER;
    const overheadCosts = Object.values(materialCosts).reduce((sum, cost) => sum + cost, 0) * this.OVERHEAD_RATE;
    const contingency = Object.values(materialCosts).reduce((sum, cost) => sum + cost, 0) * this.CONTINGENCY_RATE;

    return {
      materialCosts,
      laborCosts,
      equipmentCosts,
      overheadCosts,
      contingency,
      totalCost: laborCosts + equipmentCosts + overheadCosts + contingency,
    };
  }

  async getHistoricalPrices(materialId: string, months: number = 12): Promise<{ date: string; price: number }[]> {
    const { data } = await supabase
      .from('material_prices')
      .select('timestamp, price')
      .eq('material_id', materialId)
      .gte('timestamp', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: true });

    return (data || []).map(item => ({
      date: item.timestamp,
      price: item.price
    }));
  }

  async analyzePriceVolatility(materialId: string): Promise<{
    volatility: number;
    recommendation: string;
  }> {
    const historicalPrices = await this.getHistoricalPrices(materialId);
    if (historicalPrices.length < 2) {
      return {
        volatility: 0,
        recommendation: 'Insufficient data for volatility analysis'
      };
    }

    // Calculate price changes
    const priceChanges = [];
    for (let i = 1; i < historicalPrices.length; i++) {
      const change = (historicalPrices[i].price - historicalPrices[i - 1].price) / historicalPrices[i - 1].price;
      priceChanges.push(change);
    }

    // Calculate volatility (standard deviation of price changes)
    const mean = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
    const squaredDiffs = priceChanges.map(change => Math.pow(change - mean, 2));
    const volatility = Math.sqrt(squaredDiffs.reduce((sum, diff) => sum + diff, 0) / priceChanges.length);

    // Generate recommendation based on volatility
    let recommendation = '';
    if (volatility < 0.05) {
      recommendation = 'Price is stable. Safe to purchase at current rates.';
    } else if (volatility < 0.1) {
      recommendation = 'Moderate price fluctuation. Consider bulk purchasing if price is favorable.';
    } else {
      recommendation = 'High price volatility. Monitor closely and consider price hedging strategies.';
    }

    return { volatility, recommendation };
  }

  optimizeCosts(materials: Material[], suppliers: Supplier[]): OptimizationResult[] {
    return materials.map(material => {
      const wastageReduction = analyzeWastagePatterns(material.category);
      const optimizedQuantity = Math.ceil(material.quantity * (1 - wastageReduction));

      const substitutes = findSubstituteMaterials(material);
      const originalCost = material.quantity * material.pricePerUnit;
      const optimizedCost = optimizedQuantity * material.pricePerUnit;
      const savings = originalCost - optimizedCost;

      return {
        material,
        originalQuantity: material.quantity,
        optimizedQuantity,
        savings,
        recommendations: generateOptimizationRecommendations(material, wastageReduction, substitutes)
      };
    });
  }
}