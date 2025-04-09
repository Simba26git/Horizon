import { supabase } from '@/lib/supabase';

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
    const trends: MaterialTrend[] = [];

    for (const materialId of materialIds) {
      // Get current price
      const { data: currentPriceData } = await supabase
        .from('material_prices')
        .select('price')
        .eq('material_id', materialId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      // Get predicted price
      const { data: predictionData } = await supabase
        .from('price_predictions')
        .select('predicted_price, confidence_score')
        .eq('material_id', materialId)
        .order('prediction_date', { ascending: false })
        .limit(1)
        .single();

      // Get material name
      const { data: materialData } = await supabase
        .from('materials')
        .select('name')
        .eq('id', materialId)
        .single();

      if (currentPriceData && predictionData && materialData) {
        const currentPrice = currentPriceData.price;
        const predictedPrice = predictionData.predicted_price;
        const percentageChange = ((predictedPrice - currentPrice) / currentPrice) * 100;

        trends.push({
          materialId,
          materialName: materialData.name,
          currentPrice,
          predictedPrice,
          confidence: predictionData.confidence_score || 0,
          trend: this.determineTrend(percentageChange),
          percentageChange
        });
      }
    }

    return trends;
  }

  private determineTrend(percentageChange: number): 'increasing' | 'decreasing' | 'stable' {
    if (percentageChange > 2) return 'increasing';
    if (percentageChange < -2) return 'decreasing';
    return 'stable';
  }

  async estimateProjectCost(specs: ProjectSpecs, materials: Record<string, number>): Promise<CostBreakdown> {
    const materialCosts: Record<string, number> = {};
    let totalMaterialCost = 0;

    // Calculate material costs with predicted prices
    for (const [materialId, quantity] of Object.entries(materials)) {
      const { data: prediction } = await supabase
        .from('price_predictions')
        .select('predicted_price')
        .eq('material_id', materialId)
        .order('prediction_date', { ascending: false })
        .limit(1)
        .single();

      if (prediction) {
        const cost = prediction.predicted_price * quantity;
        materialCosts[materialId] = cost;
        totalMaterialCost += cost;
      }
    }

    // Calculate labor costs based on area and quality
    const laborRate = this.LABOR_RATES[specs.quality];
    const laborCosts = specs.area * laborRate * specs.floors;

    // Calculate equipment costs as a percentage of material costs
    const equipmentCosts = totalMaterialCost * this.EQUIPMENT_RATE_MULTIPLIER;

    // Calculate overhead costs
    const subtotal = totalMaterialCost + laborCosts + equipmentCosts;
    const overheadCosts = subtotal * this.OVERHEAD_RATE;

    // Add contingency
    const contingency = subtotal * this.CONTINGENCY_RATE;

    // Calculate total cost
    const totalCost = subtotal + overheadCosts + contingency;

    return {
      materialCosts,
      laborCosts,
      equipmentCosts,
      overheadCosts,
      contingency,
      totalCost
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
} 