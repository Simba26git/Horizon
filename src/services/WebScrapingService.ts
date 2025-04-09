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
        headless: 'new',
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
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      // Set default timeout to 30 seconds
      page.setDefaultTimeout(30000);

      // Navigate to the supplier's website
      await page.goto(supplierUrl, { waitUntil: 'networkidle0' });

      // Example scraping logic - adjust selectors based on the actual website structure
      const prices = await page.evaluate(() => {
        const items = document.querySelectorAll('.product-item');
        return Array.from(items).map(item => ({
          materialName: item.querySelector('.product-name')?.textContent?.trim() || '',
          price: parseFloat(item.querySelector('.product-price')?.textContent?.replace(/[^0-9.]/g, '') || '0'),
          currency: item.querySelector('.currency')?.textContent?.trim() || 'USD',
          unit: item.querySelector('.unit')?.textContent?.trim() || 'piece',
          supplier: document.querySelector('.supplier-name')?.textContent?.trim() || '',
          timestamp: new Date()
        }));
      });

      await this.closeBrowser();
      return prices;
    } catch (error) {
      console.error('Error scraping prices:', error);
      await this.closeBrowser();
      return [];
    }
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