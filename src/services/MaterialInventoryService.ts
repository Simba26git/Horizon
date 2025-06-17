import { supabase } from '@/lib/supabase';
import { Material, MaterialPrice, MaterialUsage, MaterialStock } from '@/types/Material';

export class MaterialInventoryService {
  async getMaterials(): Promise<Material[]> {
    return [
      {
        id: 'mock-material-id',
        name: 'Mock Material',
        unit: 'kg',
        category: 'structural',
        specifications: {},
        supplier_id: 'mock-supplier-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }

  async getMaterialById(id: string): Promise<Material | null> {
    return {
      id,
      name: 'Mock Material',
      unit: 'kg',
      category: 'structural',
      specifications: {},
      supplier_id: 'mock-supplier-id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  async addMaterial(material: Omit<Material, 'id' | 'created_at' | 'updated_at'>): Promise<Material> {
    const { data, error } = await supabase
      .from('materials')
      .insert([material])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateMaterial(id: string, updates: Partial<Material>): Promise<Material> {
    const { data, error } = await supabase
      .from('materials')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteMaterial(id: string): Promise<void> {
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getMaterialsByCategory(category: Material['category']): Promise<Material[]> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('category', category)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async getMaterialPriceHistory(materialId: string, months: number = 12): Promise<MaterialPrice[]> {
    return Array.from({ length: months }, (_, i) => ({
      id: `mock-price-${i}`,
      material_id: materialId,
      supplier_id: 'mock-supplier-id',
      price: Math.random() * 100,
      currency: 'USD',
      timestamp: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString(),
    }));
  }

  async recordMaterialUsage(usage: Omit<MaterialUsage, 'total_cost'>): Promise<void> {
    return;
  }

  async getStockLevel(materialId: string): Promise<MaterialStock | null> {
    return {
      material_id: materialId,
      quantity: 100,
      reorder_point: 20,
      optimal_order_quantity: 50,
      last_restocked: new Date().toISOString(),
    };
  }

  private async updateStockLevel(materialId: string, quantityChange: number): Promise<void> {
    const currentStock = {
      quantity: 100,
      reorder_point: 20,
    };

    const newQuantity = currentStock.quantity + quantityChange;

    if (newQuantity <= currentStock.reorder_point) {
      await this.triggerReorderAlert(materialId);
    }
  }

  private async triggerReorderAlert(materialId: string): Promise<void> {
    const { data: material } = await supabase
      .from('materials')
      .select('name')
      .eq('id', materialId)
      .single();

    if (!material) return;

    // In a real application, this would trigger notifications
    console.log(`Reorder alert: ${material.name} has reached its reorder point`);
  }

  async calculateOptimalOrderQuantity(materialId: string): Promise<number> {
    // Get historical usage data
    const { data: usageData } = await supabase
      .from('material_usage')
      .select('quantity')
      .eq('material_id', materialId);

    if (!usageData || usageData.length === 0) return 0;

    // Calculate average monthly usage
    const totalUsage = usageData.reduce((sum, record) => sum + record.quantity, 0);
    const averageMonthlyUsage = totalUsage / 12; // Assuming 12 months of data

    // Get current price
    const { data: priceData } = await supabase
      .from('material_prices')
      .select('price')
      .eq('material_id', materialId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (!priceData) return 0;

    // Economic Order Quantity (EOQ) formula
    const orderingCost = 100; // Fixed cost per order
    const holdingCost = priceData.price * 0.1; // 10% of unit price
    const annualDemand = averageMonthlyUsage * 12;

    const eoq = Math.sqrt((2 * orderingCost * annualDemand) / holdingCost);
    return Math.ceil(eoq);
  }

  async getMaterialUsageStats(materialId: string): Promise<{
    totalUsage: number;
    averageMonthlyUsage: number;
    peakUsageMonth: string;
    costTrend: Array<{ month: string; cost: number }>;
  }> {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const { data: usageData } = await supabase
      .from('material_usage')
      .select('quantity, total_cost, date')
      .eq('material_id', materialId)
      .gte('date', oneYearAgo.toISOString());

    if (!usageData || usageData.length === 0) {
      return {
        totalUsage: 0,
        averageMonthlyUsage: 0,
        peakUsageMonth: '',
        costTrend: []
      };
    }

    // Calculate total usage
    const totalUsage = usageData.reduce((sum, record) => sum + record.quantity, 0);

    // Calculate monthly usage and costs
    const monthlyData: Record<string, { usage: number; cost: number }> = {};
    
    usageData.forEach(record => {
      const month = record.date.substring(0, 7); // YYYY-MM format
      if (!monthlyData[month]) {
        monthlyData[month] = { usage: 0, cost: 0 };
      }
      monthlyData[month].usage += record.quantity;
      monthlyData[month].cost += record.total_cost;
    });

    // Find peak usage month
    let peakUsage = 0;
    let peakUsageMonth = '';
    Object.entries(monthlyData).forEach(([month, data]) => {
      if (data.usage > peakUsage) {
        peakUsage = data.usage;
        peakUsageMonth = month;
      }
    });

    // Calculate average monthly usage
    const months = Object.keys(monthlyData).length;
    const averageMonthlyUsage = totalUsage / months;

    // Create cost trend data
    const costTrend = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        cost: data.cost
      }));

    return {
      totalUsage,
      averageMonthlyUsage,
      peakUsageMonth,
      costTrend
    };
  }
}