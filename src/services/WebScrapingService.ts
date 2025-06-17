import puppeteer from 'puppeteer';
import { supabase } from '@/lib/supabase';

export interface ScrapedPrice {
  materialName: string;
  price: number;
  currency: string;
  unit: string;
  supplier: string;
  timestamp: Date;
}

export class WebScrapingService {
  private browser: puppeteer.Browser | null = null;

  private async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true, // Changed from 'new' to true to fix type mismatch
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  private async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrapePrices(supplierUrl: string): Promise<ScrapedPrice[]> {
    // Mock data for demo purposes
    return [
      {
        materialName: 'Steel Rod',
        price: 120,
        currency: 'USD',
        unit: 'kg',
        supplier: 'Mock Supplier A',
        timestamp: new Date()
      },
      {
        materialName: 'Cement Bag',
        price: 8,
        currency: 'USD',
        unit: 'bag',
        supplier: 'Mock Supplier B',
        timestamp: new Date()
      },
      {
        materialName: 'Bricks',
        price: 0.5,
        currency: 'USD',
        unit: 'piece',
        supplier: 'Mock Supplier C',
        timestamp: new Date()
      }
    ];
  }

  async updatePricesInDatabase(scrapedPrices: ScrapedPrice[]) {
    for (const price of scrapedPrices) {
      try {
        // Find the material by name
        const { data: materials } = await supabase
          .from('materials')
          .select('id')
          .eq('name', price.materialName)
          .single();

        if (!materials?.id) continue;

        // Find the supplier by name
        const { data: suppliers } = await supabase
          .from('suppliers')
          .select('id')
          .eq('name', price.supplier)
          .single();

        if (!suppliers?.id) continue;

        // Insert the new price
        await supabase.from('material_prices').insert({
          material_id: materials.id,
          supplier_id: suppliers.id,
          price: price.price,
          currency: price.currency,
          timestamp: price.timestamp.toISOString()
        });
      } catch (error) {
        console.error('Error updating price in database:', error);
      }
    }
  }

  async scrapeAndUpdatePrices() {
    try {
      // Get all active suppliers
      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('id, name, website_url')
        .not('website_url', 'is', null);

      if (!suppliers) return;

      for (const supplier of suppliers) {
        if (!supplier.website_url) continue;

        const prices = await this.scrapePrices(supplier.website_url);
        await this.updatePricesInDatabase(prices);

        // Update the last_update timestamp in update_schedules
        await supabase
          .from('update_schedules')
          .update({
            last_update: new Date().toISOString(),
            next_update: this.calculateNextUpdate()
          })
          .eq('supplier_id', supplier.id);
      }
    } catch (error) {
      console.error('Error in scrape and update process:', error);
    }
  }

  private calculateNextUpdate(): string {
    // Default to daily updates - 24 hours from now
    const nextUpdate = new Date();
    nextUpdate.setHours(nextUpdate.getHours() + 24);
    return nextUpdate.toISOString();
  }
}