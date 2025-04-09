import { supabase } from '@/lib/supabase';

export interface Material {
  id: string;
  name: string;
  unit: string;
  category: 'structural' | 'finishing' | 'electrical' | 'plumbing';
  specifications: Record<string, any>;
  supplier_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaterialPrice {
  id: string;
  material_id: string;
  supplier_id: string;
  price: number;
  currency: string;
  timestamp: string;
}

export interface MaterialUsage {
  material_id: string;
  quantity: number;
  unit_price: number;
  total_cost: number;
  date: string;
  project_id?: string;
}

export interface MaterialStock {
  material_id: string;
  quantity: number;
  reorder_point: number;
  optimal_order_quantity: number;
  last_restocked: string;
}

export class MaterialInventoryService {
  async getMaterials(): Promise<Material[]> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async getMaterialById(id: string): Promise<Material | null> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
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
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const { data, error } = await supabase
      .from('material_prices')
      .select('*')
      .eq('material_id', materialId)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async recordMaterialUsage(usage: Omit<MaterialUsage, 'total_cost'>): Promise<void> {
    // Calculate total cost
    const totalCost = usage.quantity * usage.unit_price;

    // Record the usage
    const { error } = await supabase
      .from('material_usage')
      .insert([{ ...usage, total_cost: totalCost }]);

    if (error) throw error;

    // Update stock levels if tracking is enabled
    await this.updateStockLevel(usage.material_id, -usage.quantity);
  }

  async getStockLevel(materialId: string): Promise<MaterialStock | null> {
    const { data, error } = await supabase
      .from('material_stock')
      .select('*')
      .eq('material_id', materialId)
      .single();

    if (error) throw error;
    return data;
  }

  private async updateStockLevel(materialId: string, quantityChange: number): Promise<void> {
    const { data: currentStock } = await supabase
      .from('material_stock')
      .select('quantity')
      .eq('material_id', materialId)
      .single();

    if (!currentStock) return;

    const newQuantity = currentStock.quantity + quantityChange;

    const { error } = await supabase
      .from('material_stock')
      .update({ quantity: newQuantity })
      .eq('material_id', materialId);

    if (error) throw error;

    // Check if reorder point is reached
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