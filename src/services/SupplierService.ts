import { supabase } from '@/lib/supabase';

export interface Supplier {
  id: string;
  name: string;
  rating: number;
  location: string;
  delivery_time: string;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupplierPerformance {
  supplier_id: string;
  on_time_delivery_rate: number;
  quality_rating: number;
  price_competitiveness: number;
  response_time: number;
  overall_score: number;
}

export interface PriceComparison {
  material_id: string;
  material_name: string;
  suppliers: {
    supplier_id: string;
    supplier_name: string;
    price: number;
    currency: string;
    last_updated: string;
  }[];
}

export class SupplierService {
  async getSuppliers(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('rating', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getSupplierById(id: string): Promise<Supplier | null> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async addSupplier(supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .insert([supplier])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteSupplier(id: string): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getSupplierPerformance(supplierId: string): Promise<SupplierPerformance> {
    // Get supplier's material prices
    const { data: prices } = await supabase
      .from('material_prices')
      .select('price, material_id, timestamp')
      .eq('supplier_id', supplierId);

    if (!prices || prices.length === 0) {
      return {
        supplier_id: supplierId,
        on_time_delivery_rate: 0,
        quality_rating: 0,
        price_competitiveness: 0,
        response_time: 0,
        overall_score: 0
      };
    }

    // Calculate price competitiveness
    const priceCompetitiveness = await this.calculatePriceCompetitiveness(supplierId);

    // Get supplier details
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('rating, delivery_time')
      .eq('id', supplierId)
      .single();

    // Calculate metrics
    const onTimeDeliveryRate = this.calculateOnTimeDeliveryRate(supplier?.delivery_time || '');
    const qualityRating = supplier?.rating || 0;
    const responseTime = this.calculateResponseTime(prices);

    // Calculate overall score
    const overallScore = (
      onTimeDeliveryRate * 0.3 +
      qualityRating * 0.3 +
      priceCompetitiveness * 0.3 +
      responseTime * 0.1
    );

    return {
      supplier_id: supplierId,
      on_time_delivery_rate: onTimeDeliveryRate,
      quality_rating: qualityRating,
      price_competitiveness: priceCompetitiveness,
      response_time: responseTime,
      overall_score: overallScore
    };
  }

  private calculateOnTimeDeliveryRate(deliveryTime: string): number {
    // Convert delivery time string to a score
    const [value, unit] = deliveryTime.split(' ');
    const days = parseInt(value);
    
    if (isNaN(days)) return 0;

    // Score based on delivery time (example scoring)
    if (days <= 2) return 1;
    if (days <= 5) return 0.8;
    if (days <= 7) return 0.6;
    if (days <= 14) return 0.4;
    return 0.2;
  }

  private calculateResponseTime(prices: { timestamp: string }[]): number {
    if (prices.length < 2) return 0;

    // Calculate average time between price updates
    let totalTime = 0;
    for (let i = 1; i < prices.length; i++) {
      const current = new Date(prices[i].timestamp);
      const previous = new Date(prices[i - 1].timestamp);
      totalTime += current.getTime() - previous.getTime();
    }

    const averageTime = totalTime / (prices.length - 1);
    const averageDays = averageTime / (24 * 60 * 60 * 1000);

    // Score based on average update frequency
    if (averageDays <= 1) return 1;
    if (averageDays <= 3) return 0.8;
    if (averageDays <= 7) return 0.6;
    if (averageDays <= 14) return 0.4;
    return 0.2;
  }

  private async calculatePriceCompetitiveness(supplierId: string): Promise<number> {
    // Get all materials supplied by this supplier
    const { data: supplierPrices } = await supabase
      .from('material_prices')
      .select('material_id, price')
      .eq('supplier_id', supplierId);

    if (!supplierPrices || supplierPrices.length === 0) return 0;

    let competitivenessScore = 0;

    for (const { material_id, price } of supplierPrices) {
      // Get prices from all suppliers for this material
      const { data: allPrices } = await supabase
        .from('material_prices')
        .select('price')
        .eq('material_id', material_id);

      if (!allPrices || allPrices.length === 0) continue;

      // Calculate average price
      const prices = allPrices.map(p => p.price);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

      // Calculate competitiveness score for this material
      const priceRatio = price / avgPrice;
      const materialScore = priceRatio <= 1 ? 1 : 1 / priceRatio;

      competitivenessScore += materialScore;
    }

    // Return average competitiveness score
    return competitivenessScore / supplierPrices.length;
  }

  async comparePrices(materialIds: string[]): Promise<PriceComparison[]> {
    const comparisons: PriceComparison[] = [];

    for (const materialId of materialIds) {
      // Get material details
      const { data: material } = await supabase
        .from('materials')
        .select('name')
        .eq('id', materialId)
        .single();

      if (!material) continue;

      // Get prices from all suppliers
      const { data: prices } = await supabase
        .from('material_prices')
        .select(`
          price,
          currency,
          timestamp,
          suppliers (
            id,
            name
          )
        `)
        .eq('material_id', materialId);

      if (!prices) continue;

      comparisons.push({
        material_id: materialId,
        material_name: material.name,
        suppliers: prices.map(price => ({
          supplier_id: price.suppliers.id,
          supplier_name: price.suppliers.name,
          price: price.price,
          currency: price.currency,
          last_updated: price.timestamp
        }))
      });
    }

    return comparisons;
  }

  async getSuppliersByMaterial(materialId: string): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('material_prices')
      .select(`
        suppliers (*)
      `)
      .eq('material_id', materialId);

    if (error) throw error;
    return (data || []).map(item => item.suppliers);
  }
} 