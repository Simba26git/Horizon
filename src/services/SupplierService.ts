import { supabase } from '@/lib/supabase';
import { kmeans } from 'ml-kmeans';
import { Supplier, SupplierPerformance, PriceComparison } from '@/types/Material';

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
        supplierId,
        onTimeDeliveryRate: 0,
        qualityRating: 0,
        priceCompetitiveness: 0,
        responseTime: 0,
        overallScore: 0
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
      supplierId,
      onTimeDeliveryRate,
      qualityRating,
      priceCompetitiveness,
      responseTime,
      overallScore
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
    return materialIds.map(materialId => ({
      materialId,
      materialName: 'Mock Material',
      suppliers: [
        {
          supplierId: 'mock-supplier-id',
          supplierName: 'Mock Supplier',
          price: 100,
          currency: 'USD',
          lastUpdated: new Date().toISOString(),
        },
      ],
    }));
  }

  async getSuppliersByMaterial(materialId: string): Promise<Supplier[]> {
    return [
      {
        id: 'mock-supplier-id',
        name: 'Mock Supplier',
        rating: 4.5,
        location: 'Mock Location',
        deliveryTime: '2 days',
      },
    ];
  }

  groupSuppliers(suppliers: Supplier[], k: number): { cluster: number; supplier: Supplier }[] {
    const data = suppliers.map(supplier => [supplier.rating, supplier.location.length, parseInt(supplier.deliveryTime.split(' ')[0])]);
    const { clusters } = kmeans(data, k, { initialization: 'random' });
    return suppliers.map((supplier, index) => ({ cluster: clusters[index], supplier }));
  }
}