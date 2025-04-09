import { supabase } from '@/lib/supabase';
import { WebScrapingService } from './WebScrapingService';
import { CostEstimationService } from './CostEstimationService';

interface ScheduledTask {
  id: string;
  type: 'price_update' | 'price_prediction' | 'system_maintenance';
  frequency: 'daily' | 'weekly' | 'monthly';
  lastRun: Date | null;
  nextRun: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  metadata: Record<string, any>;
}

export class SchedulerService {
  private webScrapingService: WebScrapingService;
  private costEstimationService: CostEstimationService;
  private isRunning: boolean = false;
  private scheduledTasks: ScheduledTask[] = [];

  constructor() {
    this.webScrapingService = new WebScrapingService();
    this.costEstimationService = new CostEstimationService();
  }

  async initialize() {
    // Load scheduled tasks from database
    const { data: tasks } = await supabase
      .from('update_schedules')
      .select('*')
      .eq('is_active', true);

    if (tasks) {
      this.scheduledTasks = tasks.map(task => ({
        id: task.id,
        type: 'price_update',
        frequency: task.frequency,
        lastRun: task.last_update ? new Date(task.last_update) : null,
        nextRun: new Date(task.next_update),
        status: 'pending',
        metadata: { supplier_id: task.supplier_id }
      }));
    }

    // Start the scheduler
    this.start();
  }

  private async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Run the scheduler loop
    while (this.isRunning) {
      await this.processScheduledTasks();
      await this.sleep(60000); // Check every minute
    }
  }

  private async processScheduledTasks() {
    const now = new Date();

    for (const task of this.scheduledTasks) {
      if (task.nextRun <= now && task.status === 'pending') {
        await this.executeTask(task);
      }
    }
  }

  private async executeTask(task: ScheduledTask) {
    try {
      task.status = 'running';

      switch (task.type) {
        case 'price_update':
          await this.webScrapingService.scrapeAndUpdatePrices();
          break;

        case 'price_prediction':
          await this.updatePricePredictions();
          break;

        case 'system_maintenance':
          await this.performSystemMaintenance();
          break;
      }

      // Update task status
      task.status = 'completed';
      task.lastRun = new Date();
      task.nextRun = this.calculateNextRun(task.frequency);

      // Update database
      await supabase
        .from('update_schedules')
        .update({
          last_update: task.lastRun.toISOString(),
          next_update: task.nextRun.toISOString()
        })
        .eq('id', task.id);

    } catch (error) {
      console.error(`Task execution failed:`, error);
      task.status = 'failed';
    }
  }

  private calculateNextRun(frequency: 'daily' | 'weekly' | 'monthly'): Date {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        return new Date(now.setDate(now.getDate() + 1));
      case 'weekly':
        return new Date(now.setDate(now.getDate() + 7));
      case 'monthly':
        return new Date(now.setMonth(now.getMonth() + 1));
    }
  }

  private async updatePricePredictions() {
    // Get all materials
    const { data: materials } = await supabase
      .from('materials')
      .select('id');

    if (!materials) return;

    for (const material of materials) {
      const historicalPrices = await this.costEstimationService.getHistoricalPrices(material.id);
      
      if (historicalPrices.length > 0) {
        // Simple linear regression for prediction
        const prediction = this.calculatePricePrediction(historicalPrices);
        
        // Save prediction
        await supabase.from('price_predictions').insert({
          material_id: material.id,
          predicted_price: prediction.price,
          prediction_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ahead
          confidence_score: prediction.confidence,
          factors: prediction.factors
        });
      }
    }
  }

  private calculatePricePrediction(historicalPrices: { date: string; price: number }[]): {
    price: number;
    confidence: number;
    factors: Record<string, any>;
  } {
    // Simple linear regression
    const n = historicalPrices.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = historicalPrices.map(p => p.price);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict next value
    const nextX = n;
    const predictedPrice = slope * nextX + intercept;

    // Calculate R-squared for confidence
    const yMean = sumY / n;
    const totalSS = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const residualSS = y.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * x[i] + intercept), 2), 0);
    const rSquared = 1 - (residualSS / totalSS);

    return {
      price: Math.max(0, predictedPrice), // Ensure non-negative price
      confidence: rSquared,
      factors: {
        trend: slope > 0 ? 'increasing' : 'decreasing',
        volatility: Math.abs(slope),
        dataPoints: n
      }
    };
  }

  private async performSystemMaintenance() {
    // Clean up old price records
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    await supabase
      .from('material_prices')
      .delete()
      .lt('timestamp', threeMonthsAgo.toISOString());

    // Clean up old predictions
    await supabase
      .from('price_predictions')
      .delete()
      .lt('prediction_date', new Date().toISOString());
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    this.isRunning = false;
  }
} 