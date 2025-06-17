import { supabase } from '../lib/supabase';
import { UserQuotation } from '../lib/supabase';

export class QuotationHistoryService {
  async saveQuotation(userId: string, quotationData: Omit<UserQuotation, 'id' | 'user_id' | 'created_at'>): Promise<{ id: string | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('quotations')
      .insert({
        ...quotationData,
        user_id: userId,
      })
      .select('id')
      .single();

    return {
      id: data?.id || null,
      error: error as Error | null
    };
  }

  async getQuotationHistory(userId: string): Promise<UserQuotation[]> {
    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getQuotationById(quotationId: string): Promise<UserQuotation | null> {
    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', quotationId)
      .single();

    if (error) throw error;
    return data;
  }

  async updateQuotationStatus(quotationId: string, status: 'draft' | 'final'): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('quotations')
      .update({ status })
      .eq('id', quotationId);

    return { error: error as Error | null };
  }

  async deleteQuotation(quotationId: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('quotations')
      .delete()
      .eq('id', quotationId);

    return { error: error as Error | null };
  }

  async getDraftQuotations(userId: string): Promise<UserQuotation[]> {
    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'draft')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getQuotationStats(userId: string): Promise<{
    totalQuotations: number;
    averageAmount: number;
    quotationsByMonth: { month: string; count: number }[];
  }> {
    const { data: quotations, error } = await supabase
      .from('quotations')
      .select('total_cost, created_at')
      .eq('user_id', userId);

    if (error) throw error;

    const stats = {
      totalQuotations: quotations?.length || 0,
      averageAmount: 0,
      quotationsByMonth: [] as { month: string; count: number }[]
    };

    if (quotations && quotations.length > 0) {
      // Calculate average amount
      const totalAmount = quotations.reduce((sum, q) => sum + (q.total_cost || 0), 0);
      stats.averageAmount = totalAmount / quotations.length;

      // Group quotations by month
      const monthlyData = quotations.reduce((acc: { [key: string]: number }, q) => {
        const month = new Date(q.created_at).toLocaleString('default', { month: 'long', year: 'numeric' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});

      stats.quotationsByMonth = Object.entries(monthlyData).map(([month, count]) => ({
        month,
        count
      }));
    }

    return stats;
  }
}

export const quotationHistoryService = new QuotationHistoryService(); 