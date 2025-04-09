import { supabase } from '../lib/supabase';
import { notificationService } from './NotificationService';

interface GroupBuyingOpportunity {
  id: string;
  material_id: string;
  target_quantity: number;
  current_quantity: number;
  price_per_unit: number;
  minimum_participants: number;
  current_participants: number;
  expiry_date: string;
  status: 'open' | 'closed' | 'fulfilled';
}

interface Participation {
  user_id: string;
  opportunity_id: string;
  quantity: number;
  committed_at: string;
}

export class GroupBuyingService {
  async createOpportunity(
    materialId: string,
    targetQuantity: number,
    pricePerUnit: number,
    minimumParticipants: number,
    expiryDate: string
  ): Promise<{ id: string | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('group_buying_opportunities')
      .insert({
        material_id: materialId,
        target_quantity: targetQuantity,
        current_quantity: 0,
        price_per_unit: pricePerUnit,
        minimum_participants: minimumParticipants,
        current_participants: 0,
        expiry_date: expiryDate,
        status: 'open'
      })
      .select('id')
      .single();

    return {
      id: data?.id || null,
      error: error as Error | null
    };
  }

  async joinOpportunity(
    userId: string,
    opportunityId: string,
    quantity: number
  ): Promise<{ success: boolean; error: Error | null }> {
    // Start a transaction
    const { data: opportunity, error: fetchError } = await supabase
      .from('group_buying_opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single();

    if (fetchError || !opportunity) {
      return { success: false, error: fetchError as Error };
    }

    if (opportunity.status !== 'open') {
      return {
        success: false,
        error: new Error('This opportunity is no longer available')
      };
    }

    // Add participation
    const { error: participationError } = await supabase
      .from('group_buying_participations')
      .insert({
        user_id: userId,
        opportunity_id: opportunityId,
        quantity,
        committed_at: new Date().toISOString()
      });

    if (participationError) {
      return { success: false, error: participationError };
    }

    // Update opportunity stats
    const { error: updateError } = await supabase
      .from('group_buying_opportunities')
      .update({
        current_quantity: opportunity.current_quantity + quantity,
        current_participants: opportunity.current_participants + 1,
        status: this.calculateNewStatus(
          opportunity.current_quantity + quantity,
          opportunity.target_quantity,
          opportunity.current_participants + 1,
          opportunity.minimum_participants
        )
      })
      .eq('id', opportunityId);

    return {
      success: !updateError,
      error: updateError as Error | null
    };
  }

  private calculateNewStatus(
    currentQuantity: number,
    targetQuantity: number,
    currentParticipants: number,
    minimumParticipants: number
  ): 'open' | 'closed' | 'fulfilled' {
    if (currentQuantity >= targetQuantity && currentParticipants >= minimumParticipants) {
      return 'fulfilled';
    }
    return 'open';
  }

  async getActiveOpportunities(): Promise<GroupBuyingOpportunity[]> {
    const { data } = await supabase
      .from('group_buying_opportunities')
      .select(`
        *,
        materials (name, unit),
        group_buying_participations (quantity)
      `)
      .eq('status', 'open')
      .gte('expiry_date', new Date().toISOString());

    return data || [];
  }

  async getOpportunityDetails(opportunityId: string): Promise<{
    opportunity: GroupBuyingOpportunity;
    participants: Array<{
      quantity: number;
      committed_at: string;
    }>;
    remainingQuantity: number;
    timeRemaining: string;
  } | null> {
    const { data: opportunity } = await supabase
      .from('group_buying_opportunities')
      .select(`
        *,
        materials (name, unit),
        group_buying_participations (
          quantity,
          committed_at
        )
      `)
      .eq('id', opportunityId)
      .single();

    if (!opportunity) return null;

    const remainingQuantity = opportunity.target_quantity - opportunity.current_quantity;
    const timeRemaining = this.calculateTimeRemaining(opportunity.expiry_date);

    return {
      opportunity,
      participants: opportunity.group_buying_participations,
      remainingQuantity,
      timeRemaining
    };
  }

  private calculateTimeRemaining(expiryDate: string): string {
    const remaining = new Date(expiryDate).getTime() - new Date().getTime();
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return `${days} days and ${hours} hours`;
  }

  async checkAndUpdateExpiredOpportunities(): Promise<void> {
    const { data: expiredOpportunities } = await supabase
      .from('group_buying_opportunities')
      .select('*')
      .eq('status', 'open')
      .lt('expiry_date', new Date().toISOString());

    if (!expiredOpportunities) return;

    for (const opportunity of expiredOpportunities) {
      // Update status to closed
      await supabase
        .from('group_buying_opportunities')
        .update({ status: 'closed' })
        .eq('id', opportunity.id);

      // Notify participants
      const { data: participants } = await supabase
        .from('group_buying_participations')
        .select('users (email)')
        .eq('opportunity_id', opportunity.id);

      if (participants) {
        for (const participant of participants) {
          await notificationService.sendQuotationEmail(
            participant.users.email,
            {
              subject: 'Group Buying Opportunity Update',
              message: `The group buying opportunity has expired. ${
                opportunity.status === 'fulfilled'
                  ? 'The target quantity was reached! You will be contacted shortly with payment details.'
                  : 'Unfortunately, the target quantity was not reached.'
              }`
            }
          );
        }
      }
    }
  }
}

export const groupBuyingService = new GroupBuyingService(); 