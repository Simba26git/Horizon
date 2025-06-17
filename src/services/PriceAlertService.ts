import { supabase } from '@/lib/supabase';
import { notificationService } from './NotificationService';

interface PriceAlert {
  id: string;
  user_id: string;
  material_id: string;
  target_price: number;
  current_price: number;
  notification_sent: boolean;
  created_at: string;
}

interface BulkDealAlert {
  id: string;
  supplier_id: string;
  material_ids: string[];
  discount_percentage: number;
  valid_until: string;
  minimum_quantity: number;
}

export class PriceAlertService {
  async createPriceAlert(userId: string, materialId: string, targetPrice: number): Promise<{ id: string | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('price_alerts')
      .insert({
        user_id: userId,
        material_id: materialId,
        target_price: targetPrice,
        notification_sent: false
      })
      .select('id')
      .single();

    return {
      id: data?.id || null,
      error: error as Error | null
    };
  }

  async checkPriceAlerts(): Promise<void> {
    const { data: alerts } = await supabase
      .from('price_alerts')
      .select(`
        *,
        materials (name),
        users:user_id (email)
      `)
      .eq('notification_sent', false);

    if (!alerts) return;

    for (const alert of alerts) {
      // Get current price
      const { data: priceData } = await supabase
        .from('material_prices')
        .select('price')
        .eq('material_id', alert.material_id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (priceData && priceData.price <= alert.target_price) {
        // Send notification
        await notificationService.sendEmail({
          to: alert.users.email,
          subject: 'Price Alert: Target Price Reached',
          html: `
            <h2>Good News!</h2>
            <p>The price for ${alert.materials.name} has reached your target price of ${alert.target_price}.</p>
            <p>Current price: ${priceData.price}</p>
            <p>We recommend acting quickly as prices may change.</p>
          `
        });

        // Update alert status
        await supabase
          .from('price_alerts')
          .update({ notification_sent: true })
          .eq('id', alert.id);
      }
    }
  }

  async findBulkDeals(): Promise<BulkDealAlert[]> {
    const { data: deals } = await supabase
      .from('bulk_deals')
      .select(`
        *,
        suppliers (name)
      `)
      .gte('valid_until', new Date().toISOString());

    return deals || [];
  }

  async suggestBulkPurchases(userId: string): Promise<{
    materialId: string;
    materialName: string;
    potentialSavings: number;
    recommendedQuantity: number;
  }[]> {
    // Get user's quotation history
    const { data: quotations } = await supabase
      .from('quotations')
      .select('materials')
      .eq('user_id', userId);

    if (!quotations) return [];

    // Analyze material usage patterns
    const materialUsage = new Map<string, number>();
    quotations.forEach(quotation => {
      Object.entries(quotation.materials).forEach(([materialId, quantity]) => {
        materialUsage.set(
          materialId,
          (materialUsage.get(materialId) || 0) + Number(quantity)
        );
      });
    });

    const recommendations = [];

    for (const [materialId, totalUsage] of materialUsage.entries()) {
      const { data: material } = await supabase
        .from('materials')
        .select('name')
        .eq('id', materialId)
        .single();

      if (!material) continue;

      // Find bulk pricing
      const { data: bulkPricing } = await supabase
        .from('bulk_pricing')
        .select('*')
        .eq('material_id', materialId)
        .order('quantity', { ascending: true });

      if (!bulkPricing || bulkPricing.length === 0) continue;

      // Calculate potential savings
      const regularPrice = bulkPricing[0].price_per_unit;
      const bulkPrice = bulkPricing[bulkPricing.length - 1].price_per_unit;
      const recommendedQuantity = bulkPricing[bulkPricing.length - 1].quantity;
      const potentialSavings = (regularPrice - bulkPrice) * recommendedQuantity;

      if (potentialSavings > 0) {
        recommendations.push({
          materialId,
          materialName: material.name,
          potentialSavings,
          recommendedQuantity
        });
      }
    }

    return recommendations.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }
}

export const priceAlertService = new PriceAlertService(); 