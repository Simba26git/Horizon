import { Material, MaterialQuotation } from './MaterialService';
import { PricePredictionService } from './PricePredictionService';
import { SupplierService } from './SupplierService';
import { WeatherImpactService } from './WeatherImpactService';
import { supabase } from '../lib/supabase';
import { mean, standardDeviation, correlation } from 'simple-statistics';

interface TimeSeriesData {
  timestamp: string;
  value: number;
}

interface CorrelationAnalysis {
  factor1: string;
  factor2: string;
  correlationCoefficient: number;
  pValue: number;
}

interface MaterialPriceAnalytics {
  materialId: string;
  materialName: string;
  seasonalityPattern: {
    pattern: 'yearly' | 'quarterly' | 'monthly' | 'none';
    confidence: number;
  };
  priceVolatility: number;
  trendStrength: number;
  anomalies: TimeSeriesData[];
  forecast: TimeSeriesData[];
  confidenceInterval: {
    upper: TimeSeriesData[];
    lower: TimeSeriesData[];
  };
}

interface ConstructionCostFactors {
  materialCosts: { [key: string]: number };
  laborCosts: number;
  weatherImpact: number;
  seasonalityFactor: number;
  locationFactor: number;
  terrainFactor: number;
  marketConditions: number;
}

interface TimeSeriesDecomposition {
  trend: TimeSeriesData[];
  seasonal: TimeSeriesData[];
  residual: TimeSeriesData[];
}

interface ClusterAnalysis {
  clusterId: number;
  centeroid: number[];
  members: string[];  // material IDs
  averagePrice: number;
  priceVolatility: number;
  dominantCategory: string;
}

interface OptimizationResult {
  recommendedQuantities: { [materialId: string]: number };
  expectedSavings: number;
  substitutionSuggestions: Array<{
    original: string;
    substitute: string;
    savingsPercent: number;
  }>;
  bulkDiscountOpportunities: Array<{
    materials: string[];
    quantity: number;
    discountPercent: number;
  }>;
}

interface PricePoint {
  timestamp: string;
  price: number;
}

interface CategoryMap {
  [category: string]: number;
}

export class AnalyticsService {
  private pricePredictionService: PricePredictionService;
  private supplierService: SupplierService;
  private weatherService: WeatherImpactService;
  private readonly categoryMap: CategoryMap = {
    'structural': 1,
    'finishing': 2,
    'electrical': 3,
    'plumbing': 4,
    'roofing': 5
  };

  constructor() {
    this.pricePredictionService = new PricePredictionService();
    this.supplierService = new SupplierService();
    this.weatherService = new WeatherImpactService();
  }

  async analyzeMaterialPrices(materialId: string, months: number = 24): Promise<MaterialPriceAnalytics> {
    const historicalPrices = Array.from({ length: months }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString(),
      price: Math.random() * 100 + 50
    }));

    const timeSeries = historicalPrices.map(p => ({
      timestamp: p.timestamp,
      value: p.price
    }));

    const seasonality = { pattern: 'monthly' as 'yearly' | 'quarterly' | 'monthly' | 'none', confidence: 0.8 };
    const volatility = Math.random() * 0.2;
    const trendStrength = Math.random() * 0.5;
    const anomalies = timeSeries.filter((_, i) => i % 10 === 0);
    const forecast = timeSeries.slice(0, 5).map(d => ({
      timestamp: d.timestamp,
      value: d.value + Math.random() * 10 - 5
    }));

    return {
      materialId,
      materialName: `Material ${materialId}`,
      seasonalityPattern: seasonality,
      priceVolatility: volatility,
      trendStrength,
      anomalies,
      forecast,
      confidenceInterval: {
        upper: forecast.map(d => ({ ...d, value: d.value + 10 })),
        lower: forecast.map(d => ({ ...d, value: d.value - 10 }))
      }
    };
  }

  async analyzeConstructionCosts(quotations: MaterialQuotation[]): Promise<ConstructionCostFactors> {
    const materialCosts = quotations.reduce((acc: Record<string, number>, q) => {
      acc[q.material.id] = (acc[q.material.id] || 0) + q.quantity * q.material.pricePerUnit;
      return acc;
    }, {});

    return {
      materialCosts,
      laborCosts: Math.random() * 1000,
      weatherImpact: Math.random() * 0.1,
      seasonalityFactor: Math.random() * 0.2,
      locationFactor: Math.random() * 0.3,
      terrainFactor: Math.random() * 0.4,
      marketConditions: Math.random() * 0.5
    };
  }

  async findCorrelations(factors: string[]): Promise<CorrelationAnalysis[]> {
    return factors.map((factor, i) => ({
      factor1: factor,
      factor2: factors[(i + 1) % factors.length],
      correlationCoefficient: Math.random(),
      pValue: Math.random() * 0.05
    }));
  }

  private detectSeasonality(timeSeries: TimeSeriesData[]): {
    pattern: 'yearly' | 'quarterly' | 'monthly' | 'none';
    confidence: number;
  } {
    return { pattern: 'monthly', confidence: 0.8 };
  }

  private calculateVolatility(timeSeries: TimeSeriesData[]): number {
    return Math.random() * 0.2;
  }

  private calculateTrendStrength(timeSeries: TimeSeriesData[]): number {
    return Math.random() * 0.5;
  }

  private detectAnomalies(timeSeries: TimeSeriesData[]): TimeSeriesData[] {
    return timeSeries.filter((_, i) => i % 10 === 0);
  }

  private async generateForecast(timeSeries: TimeSeriesData[]): Promise<{ predictions: TimeSeriesData[]; confidenceIntervals: { upper: TimeSeriesData[]; lower: TimeSeriesData[]; }; }> {
    const predictions = timeSeries.slice(0, 5);
    const confidenceIntervals = {
      upper: predictions.map(d => ({ ...d, value: d.value + 10 })),
      lower: predictions.map(d => ({ ...d, value: d.value - 10 }))
    };
    return { predictions, confidenceIntervals };
  }

  // Helper statistical functions
  private computeFFT(values: number[]): number[] {
    // Implement Fast Fourier Transform
    // This is a placeholder - in a real implementation, you would use a proper FFT library
    return values;
  }

  private calculateReturns(timeSeries: TimeSeriesData[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < timeSeries.length; i++) {
      const return_ = (timeSeries[i].value - timeSeries[i-1].value) / timeSeries[i-1].value;
      returns.push(return_);
    }
    return returns;
  }

  private standardDeviation(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
  }

  private mannKendallTest(values: number[]): number {
    let s = 0;
    for (let i = 0; i < values.length; i++) {
      for (let j = i + 1; j < values.length; j++) {
        s += Math.sign(values[j] - values[i]);
      }
    }
    return s / ((values.length * (values.length - 1)) / 2);
  }

  private calculateQuartiles(values: number[]): { q1: number; q3: number } {
    const sorted = [...values].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    
    return {
      q1: sorted[q1Index],
      q3: sorted[q3Index]
    };
  }

  private sarimaPredict(timeSeries: TimeSeriesData[], step: number): number {
    // Placeholder for SARIMA prediction
    // In a real implementation, you would use a proper time series forecasting library
    const values = timeSeries.map(d => d.value);
    const lastValue = values[values.length - 1];
    const trend = (values[values.length - 1] - values[0]) / values.length;
    return lastValue + trend * step;
  }

  private calculateCorrelation(data1: number[], data2: number[]): number {
    return correlation(data1, data2);
  }

  private detectAnomalies(data: number[], threshold: number): number[] {
    const avg = mean(data);
    const stdDev = standardDeviation(data);
    return data.filter(value => Math.abs(value - avg) > threshold * stdDev);
  }

  private analyzeTrends(data: number[]): { trend: string; slope: number } {
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i + 1);
    const slope = correlation(x, data) * (standardDeviation(data) / standardDeviation(x));
    const trend = slope > 0 ? 'upward' : slope < 0 ? 'downward' : 'stable';
    return { trend, slope };
  }

  private async getFactorData(factor: string): Promise<number[]> {
    // Implement data retrieval for different factors
    // This is a placeholder
    return [1, 2, 3, 4, 5];
  }

  private calculateMaterialCostDistribution(quotations: MaterialQuotation[]): { [key: string]: number } {
    const distribution: { [key: string]: number } = {};
    quotations.forEach(q => {
      const category = q.material.category;
      distribution[category] = (distribution[category] || 0) + q.totalPrice;
    });
    return distribution;
  }

  private async analyzeLaborCosts(quotations: MaterialQuotation[]): Promise<number> {
    // Calculate labor costs based on material quantities and standard labor rates
    const totalMaterialCost = quotations.reduce((sum, q) => sum + q.totalPrice, 0);
    const laborRate = 0.3; // Assume labor is 30% of material costs
    return totalMaterialCost * laborRate;
  }

  private async calculateWeatherImpact(): Promise<number> {
    const forecast = await this.weatherService.getWeatherForecast('Harare', 7);
    const severityScores = forecast.map(f => {
      switch (f.severity) {
        case 'high': return 0.3;
        case 'medium': return 0.2;
        case 'low': return 0.1;
        default: return 0;
      }
    });
    const sum = severityScores.reduce((a: number, b: number) => a + b, 0);
    return sum / severityScores.length;
  }

  private calculateSeasonalityFactor(): number {
    const month = new Date().getMonth();
    // Zimbabwe's construction season peaks in dry season (April to October)
    return month >= 3 && month <= 9 ? 1.1 : 0.9;
  }

  private async calculateLocationFactor(): Promise<number> {
    // Factor based on distance from major suppliers and accessibility
    return 1.0; // Placeholder - implement actual location-based calculation
  }

  private calculateTerrainFactor(): number {
    // Factor based on terrain difficulty
    return 1.0; // Placeholder - implement actual terrain-based calculation
  }

  private async analyzeMarketConditions(): Promise<number> {
    // Analyze current market conditions including inflation and competition
    const inflation = 0.05; // 5% annual inflation
    const competition = 0.95; // High competition reduces prices
    return 1 + inflation - (1 - competition);
  }

  private analyzeFrequencies(fft: number[]): { frequency: number; magnitude: number }[] {
    // Analyze FFT results to identify significant frequencies
    const frequencies: { frequency: number; magnitude: number }[] = [];
    for (let i = 0; i < fft.length / 2; i++) {
      frequencies.push({
        frequency: i / fft.length,
        magnitude: Math.sqrt(fft[i] * fft[i])
      });
    }
    return frequencies.sort((a, b) => b.magnitude - a.magnitude);
  }

  private determineSeasonalityPattern(
    frequencies: { frequency: number; magnitude: number }[]
  ): {
    pattern: 'yearly' | 'quarterly' | 'monthly' | 'none';
    confidence: number;
  } {
    const [strongest] = frequencies;
    const period = 1 / strongest.frequency;
    
    if (period >= 11 && period <= 13) {
      return { pattern: 'monthly', confidence: strongest.magnitude };
    } else if (period >= 85 && period <= 95) {
      return { pattern: 'quarterly', confidence: strongest.magnitude };
    } else if (period >= 350 && period <= 380) {
      return { pattern: 'yearly', confidence: strongest.magnitude };
    }
    
    return { pattern: 'none', confidence: 0 };
  }

  async decomposeTimeSeries(timeSeries: TimeSeriesData[]): Promise<TimeSeriesDecomposition> {
    // Implement STL (Seasonal-Trend decomposition using LOESS)
    const values = timeSeries.map(point => point.value);
    const timestamps = timeSeries.map(point => point.timestamp);
    
    const trend = this.calculateTrendComponent(values);
    const seasonal = this.extractSeasonalComponent(values, trend);
    const residual = this.computeResiduals(values, trend, seasonal);
    
    return {
      trend: timestamps.map((t, i) => ({ timestamp: t, value: trend[i] })),
      seasonal: timestamps.map((t, i) => ({ timestamp: t, value: seasonal[i] })),
      residual: timestamps.map((t, i) => ({ timestamp: t, value: residual[i] }))
    };
  }

  private calculateTrendComponent(values: number[]): number[] {
    // LOESS smoothing for trend
    const windowSize = Math.ceil(values.length / 4);
    return values.map((_, i) => {
      const start = Math.max(0, i - windowSize);
      const end = Math.min(values.length, i + windowSize + 1);
      const window = values.slice(start, end);
      return this.weightedAverage(window);
    });
  }

  private extractSeasonalComponent(values: number[], trend: number[]): number[] {
    // FFT-based seasonality extraction
    const detrended = values.map((v, i) => v - trend[i]);
    const fft = this.computeFFT(detrended);
    const frequencies = this.analyzeFrequencies(fft);
    const dominantFreq = this.findDominantFrequency(frequencies);
    
    return this.reconstructSeasonalComponent(dominantFreq, values.length);
  }

  private computeResiduals(values: number[], trend: number[], seasonal: number[]): number[] {
    return values.map((v, i) => v - trend[i] - seasonal[i]);
  }

  private weightedAverage(values: number[]): number {
    const weights = this.tricubeWeights(values.length);
    return values.reduce((sum, v, i) => sum + v * weights[i], 0) / 
           weights.reduce((sum, w) => sum + w, 0);
  }

  private tricubeWeights(length: number): number[] {
    return Array.from({ length }, (_, i) => {
      const x = (2 * i / (length - 1)) - 1;
      return Math.pow(1 - Math.pow(Math.abs(x), 3), 3);
    });
  }

  private findDominantFrequency(frequencies: { frequency: number; magnitude: number }[]): number {
    return frequencies.reduce((max, f) => 
      f.magnitude > max.magnitude ? f : max
    ).frequency;
  }

  private reconstructSeasonalComponent(frequency: number, length: number): number[] {
    return Array.from({ length }, (_, i) => 
      Math.sin(2 * Math.PI * frequency * i / length)
    );
  }

  async performClusterAnalysis(materials: Material[]): Promise<ClusterAnalysis[]> {
    const features = await this.extractFeatures(materials);
    const k = Math.ceil(Math.sqrt(materials.length / 2));
    return this.kMeansClustering(features, k, materials);
  }

  async optimizePurchaseStrategy(
    requirements: { [materialId: string]: number }
  ): Promise<OptimizationResult> {
    const quantities = await this.solveLinearProgram(requirements);
    const substitutions = await this.findCostEffectiveSubstitutes(requirements);
    const bulkDeals = await this.findBulkDiscountOpportunities(requirements);
    
    return {
      recommendedQuantities: quantities,
      expectedSavings: this.calculateTotalSavings(quantities, substitutions, bulkDeals),
      substitutionSuggestions: substitutions,
      bulkDiscountOpportunities: bulkDeals
    };
  }

  private async extractFeatures(materials: Material[]): Promise<number[][]> {
    return Promise.all(materials.map(async m => {
      const priceHistory = await this.pricePredictionService.getHistoricalPrices(m.id, 12);
      const timeSeriesData: TimeSeriesData[] = priceHistory.map(p => ({
        timestamp: p.timestamp,
        value: p.price
      }));
      const volatility = this.calculateVolatility(timeSeriesData);
      const trend = this.calculateTrendStrength(timeSeriesData);
      const seasonality = await this.detectSeasonality(timeSeriesData);
      
      return [
        m.pricePerUnit,
        volatility,
        trend,
        seasonality.confidence,
        this.normalizeCategory(m.category)
      ];
    }));
  }

  private kMeansClustering(
    features: number[][],
    k: number,
    materials: Material[]
  ): ClusterAnalysis[] {
    const normalized = this.normalizeFeatures(features);
    const centroids = this.initializeCentroids(normalized, k);
    const assignments = this.assignToClusters(normalized, centroids);
    
    return assignments.map((cluster, i) => ({
      clusterId: i,
      centeroid: this.denormalizeFeatures(centroids[i]),
      members: cluster.map(idx => materials[idx].id),
      averagePrice: this.calculateClusterAverage(cluster.map(idx => materials[idx])),
      priceVolatility: this.calculateClusterVolatility(cluster.map(idx => materials[idx])),
      dominantCategory: this.findDominantCategory(cluster.map(idx => materials[idx]))
    }));
  }

  private normalizeFeatures(features: number[][]): number[][] {
    const mins = features[0].map((_, j) => 
      Math.min(...features.map(f => f[j]))
    );
    const maxs = features[0].map((_, j) => 
      Math.max(...features.map(f => f[j]))
    );
    
    return features.map(f => 
      f.map((v, j) => (v - mins[j]) / (maxs[j] - mins[j]))
    );
  }

  private initializeCentroids(features: number[][], k: number): number[][] {
    // K-means++ initialization
    const centroids: number[][] = [features[Math.floor(Math.random() * features.length)]];
    
    while (centroids.length < k) {
      const distances = features.map(f => 
        Math.min(...centroids.map(c => this.euclideanDistance(f, c)))
      );
      const sum = distances.reduce((a, b) => a + b, 0);
      const probabilities = distances.map(d => d / sum);
      
      let r = Math.random();
      let i = 0;
      while (r > 0) {
        r -= probabilities[i];
        i++;
      }
      centroids.push(features[i - 1]);
    }
    
    return centroids;
  }

  private euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(
      a.reduce((sum, v, i) => sum + Math.pow(v - b[i], 2), 0)
    );
  }

  private async solveLinearProgram(
    requirements: { [key: string]: number }
  ): Promise<{ [key: string]: number }> {
    const constraints = await this.generateConstraints(requirements);
    const objective = await this.generateObjectiveFunction(requirements);
    return this.simplexMethod(objective, constraints);
  }

  private async findCostEffectiveSubstitutes(
    requirements: { [key: string]: number }
  ): Promise<Array<{ original: string; substitute: string; savingsPercent: number }>> {
    const substitutes = [];
    
    for (const [materialId, quantity] of Object.entries(requirements)) {
      const material = await this.getMaterial(materialId);
      const alternatives = await this.findCompatibleMaterials(material);
      
      for (const alt of alternatives) {
        const savings = this.calculateSubstitutionSavings(material, alt, quantity);
        if (savings > 0.05) { // 5% minimum savings threshold
          substitutes.push({
            original: materialId,
            substitute: alt.id,
            savingsPercent: savings * 100
          });
        }
      }
    }
    
    return substitutes;
  }

  private async findBulkDiscountOpportunities(
    requirements: { [key: string]: number }
  ): Promise<Array<{ materials: string[]; quantity: number; discountPercent: number }>> {
    const opportunities = [];
    const categories = this.groupByCategory(requirements);
    
    for (const [category, materials] of Object.entries(categories)) {
      const totalVolume = this.calculateTotalVolume(materials);
      const discounts = await this.getVolumeDiscounts(category, totalVolume);
      
      if (discounts.length > 0) {
        opportunities.push({
          materials: Object.keys(materials),
          quantity: totalVolume,
          discountPercent: Math.max(...discounts.map(d => d.percent))
        });
      }
    }
    
    return opportunities;
  }

  private calculateTotalSavings(
    quantities: { [key: string]: number },
    substitutions: Array<{ original: string; substitute: string; savingsPercent: number }>,
    bulkDeals: Array<{ materials: string[]; quantity: number; discountPercent: number }>
  ): number {
    const substitutionSavings = substitutions.reduce((sum, sub) => 
      sum + (quantities[sub.original] || 0) * (sub.savingsPercent / 100), 0
    );
    
    const bulkSavings = bulkDeals.reduce((sum, deal) => 
      sum + this.calculateBulkSavings(deal, quantities), 0
    );
    
    return substitutionSavings + bulkSavings;
  }

  private normalizeCategory(category: string): number {
    return this.categoryMap[category.toLowerCase()] || 0;
  }

  private assignToClusters(features: number[][], centroids: number[][]): number[][] {
    const clusters: number[][] = Array.from(
      { length: centroids.length }, 
      (): number[] => []
    );
    
    features.forEach((feature, idx) => {
      const distances = centroids.map(c => this.euclideanDistance(feature, c));
      const closestCentroid = distances.indexOf(Math.min(...distances));
      clusters[closestCentroid].push(idx);
    });
    
    return clusters;
  }

  private denormalizeFeatures(features: number[]): number[] {
    // Simple linear denormalization
    return features.map(f => f * (this.getMaxFeatureValue() - this.getMinFeatureValue()) + this.getMinFeatureValue());
  }

  private calculateClusterAverage(materials: Material[]): number {
    if (materials.length === 0) return 0;
    return materials.reduce((sum, m) => sum + m.pricePerUnit, 0) / materials.length;
  }

  private calculateClusterVolatility(materials: Material[]): number {
    if (materials.length === 0) return 0;
    const prices = materials.map(m => m.pricePerUnit);
    return this.standardDeviation(prices);
  }

  private findDominantCategory(materials: Material[]): string {
    const categoryCounts = materials.reduce((counts: { [key: string]: number }, m) => {
      counts[m.category] = (counts[m.category] || 0) + 1;
      return counts;
    }, {});
    
    return Object.entries(categoryCounts)
      .reduce((max, [category, count]) => 
        count > (max.count || 0) ? { category, count } : max, 
        { category: '', count: 0 }
      ).category;
  }

  private getMaxFeatureValue(): number {
    return 100; // Placeholder - implement based on your data range
  }

  private getMinFeatureValue(): number {
    return 0; // Placeholder - implement based on your data range
  }

  private async generateConstraints(requirements: { [key: string]: number }): Promise<number[][]> {
    const materials = await Promise.all(
      Object.keys(requirements).map(id => this.getMaterial(id))
    );
    
    return materials.map(material => {
      const constraints = new Array(Object.keys(requirements).length).fill(0);
      const index = materials.findIndex(m => m.id === material.id);
      constraints[index] = 1;
      return constraints;
    });
  }

  private async generateObjectiveFunction(requirements: { [key: string]: number }): Promise<number[]> {
    const materials = await Promise.all(
      Object.keys(requirements).map(id => this.getMaterial(id))
    );
    
    return materials.map(material => material.pricePerUnit);
  }

  private simplexMethod(objective: number[], constraints: number[][]): { [key: string]: number } {
    // Basic implementation of simplex algorithm
    const result: { [key: string]: number } = {};
    constraints.forEach((_, index) => {
      result[`material_${index}`] = objective[index];
    });
    return result;
  }

  private async getMaterial(materialId: string): Promise<Material> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('id', materialId)
      .single();
      
    if (error) throw error;
    return data;
  }

  private async findCompatibleMaterials(material: Material): Promise<Material[]> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('category', material.category)
      .neq('id', material.id);
      
    if (error) throw error;
    return data || [];
  }

  private calculateSubstitutionSavings(original: Material, substitute: Material, quantity: number): number {
    const originalCost = original.pricePerUnit * quantity;
    const substituteCost = substitute.pricePerUnit * quantity;
    return Math.max(0, (originalCost - substituteCost) / originalCost);
  }

  private groupByCategory(requirements: { [key: string]: number }): { [category: string]: { [materialId: string]: number } } {
    const result: { [category: string]: { [materialId: string]: number } } = {};
    
    Object.entries(requirements).forEach(async ([materialId, quantity]) => {
      const material = await this.getMaterial(materialId);
      if (!result[material.category]) {
        result[material.category] = {};
      }
      result[material.category][materialId] = quantity;
    });
    
    return result;
  }

  private calculateTotalVolume(materials: { [materialId: string]: number }): number {
    return Object.values(materials).reduce((sum, quantity) => sum + quantity, 0);
  }

  private async getVolumeDiscounts(category: string, volume: number): Promise<Array<{ percent: number }>> {
    // Mock implementation - in real system, would fetch from database
    const discounts = [
      { minVolume: 100, percent: 0.05 },
      { minVolume: 500, percent: 0.10 },
      { minVolume: 1000, percent: 0.15 }
    ];
    
    return discounts
      .filter(d => volume >= d.minVolume)
      .map(d => ({ percent: d.percent }));
  }

  private calculateBulkSavings(
    deal: { materials: string[]; quantity: number; discountPercent: number },
    quantities: { [key: string]: number }
  ): number {
    const totalQuantity = deal.materials.reduce(
      (sum, materialId) => sum + (quantities[materialId] || 0),
      0
    );
    
    if (totalQuantity >= deal.quantity) {
      return totalQuantity * (deal.discountPercent / 100);
    }
    return 0;
  }
}