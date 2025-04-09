interface EmailData {
  to: string;
  subject: string;
  quotationNumber: string;
  quotationData: any;
}

// Mock exchange rates (in a real app, these would be fetched from an API)
const EXCHANGE_RATES = {
  USD: 1,
  EUR: 0.85,
  GBP: 0.73,
  JPY: 110.5,
  AUD: 1.35,
  CAD: 1.25,
  SGD: 1.34
};

export type Currency = keyof typeof EXCHANGE_RATES;

class NotificationService {
  private async sendEmail(data: EmailData): Promise<boolean> {
    // In a real implementation, this would use an email service like SendGrid or AWS SES
    console.log('Sending email:', {
      to: data.to,
      subject: data.subject,
      quotationNumber: data.quotationNumber
    });
    return true;
  }

  async sendQuotationEmail(email: string, quotationData: any): Promise<boolean> {
    try {
      const emailData: EmailData = {
        to: email,
        subject: `Construction Quotation #${quotationData.quotationNumber}`,
        quotationNumber: quotationData.quotationNumber,
        quotationData
      };

      const success = await this.sendEmail(emailData);
      return success;
    } catch (error) {
      console.error('Failed to send quotation email:', error);
      return false;
    }
  }

  convertCurrency(amount: number, from: Currency = 'USD', to: Currency = 'USD'): number {
    if (from === to) return amount;
    
    // Convert to USD first if not already in USD
    const amountInUSD = from === 'USD' ? amount : amount / EXCHANGE_RATES[from];
    
    // Convert from USD to target currency
    return amountInUSD * EXCHANGE_RATES[to];
  }

  formatCurrency(amount: number, currency: Currency = 'USD'): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return formatter.format(amount);
  }

  getAvailableCurrencies(): Currency[] {
    return Object.keys(EXCHANGE_RATES) as Currency[];
  }

  async getLatestExchangeRates(): Promise<typeof EXCHANGE_RATES> {
    // In a real implementation, this would fetch from a currency API
    return EXCHANGE_RATES;
  }
}

export const notificationService = new NotificationService(); 