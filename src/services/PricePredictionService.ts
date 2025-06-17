import { supabase } from '../lib/supabase';

interface PricePoint {
  price: number;
  timestamp: string;
}

interface PredictionFactors {
  seasonality: number;
  inflation: number;
  marketTrend: number;
  supplierCompetition: number;
}

export class PricePredictionService {
  private readonly INFLATION_RATE = 0.03; // 3% annual inflation
  private readonly SEASONAL_PATTERNS = {
    'Q1': 1.05, // 5% higher in Q1
    'Q2': 0.95, // 5% lower in Q2
    'Q3': 0.98, // 2% lower in Q3
    'Q4': 1.02  // 2% higher in Q4
  };

  async getHistoricalPrices(materialId: string, months: number = 12): Promise<PricePoint[]> {
    const { data, error } = await supabase
      .from('material_prices')
      .select('price, timestamp')
      .eq('material_id', materialId)
      .gte('timestamp', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  private calculateSeasonality(date: Date): number {
    const month = date.getMonth();
    if (month <= 2) return this.SEASONAL_PATTERNS.Q1;
    if (month <= 5) return this.SEASONAL_PATTERNS.Q2;
    if (month <= 8) return this.SEASONAL_PATTERNS.Q3;
    return this.SEASONAL_PATTERNS.Q4;
  }

  private calculateInflation(monthsAhead: number): number {
    return Math.pow(1 + this.INFLATION_RATE, monthsAhead / 12);
  }

  private analyzeMarketTrend(prices: PricePoint[]): Promise<number> {
    if (prices.length < 2) return Promise.resolve(1);

    const priceChanges = prices.slice(1).map((point, index) => {
      const previousPrice = prices[index].price;
      return (point.price - previousPrice) / previousPrice;
    });

    const averageChange = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
    return Promise.resolve(1 + averageChange);
  }

  private analyzeSupplierCompetition(materialId: string): Promise<number> {
    return new Promise((resolve, reject) => {
      supabase
        .from('material_prices')
        .select('supplier_id')
        .eq('material_id', materialId)
        .then(({ data, error }) => {
          if (error) {
            reject(error);
          } else if (!data) {
            reject(new Error('No data returned from supplier competition query'));
          } else {
            const uniqueSuppliers = new Set(data.map(d => d.supplier_id));
            const competitionFactor = Math.max(0.9, 1 - (uniqueSuppliers.size * 0.02));
            resolve(competitionFactor);
          }
        });
    });
  }

  async predictPrice(materialId: string, targetDate: Date): Promise<number> {
    const historicalPrices = await this.getHistoricalPrices(materialId);
    if (historicalPrices.length === 0) {
      throw new Error('No historical price data available');
    }

    const currentPrice = historicalPrices[historicalPrices.length - 1].price;
    const monthsAhead = (targetDate.getTime() - new Date().getTime()) / (30 * 24 * 60 * 60 * 1000);

    const factors: PredictionFactors = {
      seasonality: this.calculateSeasonality(targetDate),
      inflation: this.calculateInflation(monthsAhead),
      marketTrend: await this.analyzeMarketTrend(historicalPrices),
      supplierCompetition: await this.analyzeSupplierCompetition(materialId)
    };

    // Combine all factors to predict the future price
    const predictedPrice = currentPrice *
      factors.seasonality *
      factors.inflation *
      factors.marketTrend *
      factors.supplierCompetition;

    return Math.round(predictedPrice * 100) / 100; // Round to 2 decimal places
  }

  async getPriceTrend(materialId: string): Promise<{
    trend: 'up' | 'down' | 'stable';
    percentage: number;
    confidence: number;
  }> {
    const prices = await this.getHistoricalPrices(materialId, 3); // Last 3 months
    if (prices.length < 2) return { trend: 'stable', percentage: 0, confidence: 0 };

    const firstPrice = prices[0].price;
    const lastPrice = prices[prices.length - 1].price;
    const change = ((lastPrice - firstPrice) / firstPrice) * 100;
    const confidence = Math.min(prices.length / 10, 1) * 100; // More data points = higher confidence

    return {
      trend: change > 1 ? 'up' : change < -1 ? 'down' : 'stable',
      percentage: Math.abs(change),
      confidence
    };
  }

  async predictFuturePrices(materialId: string, monthsAhead: number = 6): Promise<PricePoint[]> {
    // Mock data for demo purposes
    const historicalPrices = await this.getHistoricalPrices(materialId, 12);
    const lastPrice = historicalPrices[historicalPrices.length - 1]?.price || 100;

    const predictions: PricePoint[] = Array.from({ length: monthsAhead }, (_, i) => {
      const futureDate = new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000);
      const seasonality = this.calculateSeasonality(futureDate);
      const inflation = this.calculateInflation(i + 1);
      const marketTrend = this.analyzeMarketTrend(historicalPrices);

      const predictedPrice = lastPrice * Number(seasonality) * Number(inflation) * Number(marketTrend); // Ensure all factors are numbers

      return {
        price: predictedPrice,
        timestamp: futureDate.toISOString()
      };
    });

    return predictions;
  }
}

export const pricePredictionService = new PricePredictionService();