import { webScrapingService } from './WebScrapingService';
import { pricePredictionService } from './PricePredictionService';
import { supabase } from '../lib/supabase';

interface UpdateSchedule {
  id: string;
  supplier_id: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  last_update: string;
  next_update: string;
  is_active: boolean;
}

export class PriceUpdateScheduler {
  private readonly UPDATE_INTERVALS = {
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
    monthly: 30 * 24 * 60 * 60 * 1000
  };

  async scheduleUpdate(supplierId: string, frequency: 'daily' | 'weekly' | 'monthly'): Promise<{ error: Error | null }> {
    const now = new Date();
    const nextUpdate = new Date(now.getTime() + this.UPDATE_INTERVALS[frequency]);

    const { error } = await supabase
      .from('update_schedules')
      .insert({
        supplier_id: supplierId,
        frequency,
        last_update: now.toISOString(),
        next_update: nextUpdate.toISOString(),
        is_active: true
      });

    return { error: error as Error | null };
  }

  async getScheduledUpdates(): Promise<UpdateSchedule[]> {
    const { data, error } = await supabase
      .from('update_schedules')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  }

  async runScheduledUpdates(): Promise<void> {
    const now = new Date();
    const { data: schedules, error } = await supabase
      .from('update_schedules')
      .select('*')
      .eq('is_active', true)
      .lte('next_update', now.toISOString());

    if (error) throw error;

    for (const schedule of schedules || []) {
      try {
        // Run web scraping for the supplier
        await webScrapingService.scrapePrices(schedule.supplier_id);

        // Update the schedule
        const nextUpdate = new Date(now.getTime() + this.UPDATE_INTERVALS[schedule.frequency]);
        await supabase
          .from('update_schedules')
          .update({
            last_update: now.toISOString(),
            next_update: nextUpdate.toISOString()
          })
          .eq('id', schedule.id);

        // Update price predictions
        const { data: materials } = await supabase
          .from('materials')
          .select('id')
          .eq('supplier_id', schedule.supplier_id);

        if (materials) {
          for (const material of materials) {
            const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead
            const predictedPrice = await pricePredictionService.predictPrice(material.id, futureDate);

            await supabase
              .from('price_predictions')
              .insert({
                material_id: material.id,
                predicted_price: predictedPrice,
                prediction_date: futureDate.toISOString(),
                created_at: now.toISOString()
              });
          }
        }
      } catch (error) {
        console.error(`Failed to update prices for supplier ${schedule.supplier_id}:`, error);
        // Log the error but continue with other schedules
      }
    }
  }

  async pauseSchedule(scheduleId: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('update_schedules')
      .update({ is_active: false })
      .eq('id', scheduleId);

    return { error: error as Error | null };
  }

  async resumeSchedule(scheduleId: string): Promise<{ error: Error | null }> {
    const now = new Date();
    const { data: schedule, error: fetchError } = await supabase
      .from('update_schedules')
      .select('frequency')
      .eq('id', scheduleId)
      .single();

    if (fetchError) return { error: fetchError as Error };

    const nextUpdate = new Date(now.getTime() + this.UPDATE_INTERVALS[schedule.frequency]);
    const { error } = await supabase
      .from('update_schedules')
      .update({
        is_active: true,
        last_update: now.toISOString(),
        next_update: nextUpdate.toISOString()
      })
      .eq('id', scheduleId);

    return { error: error as Error | null };
  }

  // Start the scheduler
  startScheduler(intervalMinutes: number = 15): NodeJS.Timer {
    return setInterval(async () => {
      await this.runScheduledUpdates();
    }, intervalMinutes * 60 * 1000);
  }
}

export const priceUpdateScheduler = new PriceUpdateScheduler(); 