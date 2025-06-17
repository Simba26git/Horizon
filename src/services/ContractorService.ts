import { supabase } from '../lib/supabase';

interface Contractor {
  id: string;
  user_id: string;
  company_name: string;
  license_number: string;
  specializations: string[];
  experience_years: number;
  rating: number;
  total_reviews: number;
  status: 'active' | 'inactive' | 'suspended';
}

interface ContractorReview {
  id: string;
  contractor_id: string;
  reviewer_id: string;
  project_id: string;
  rating: number;
  review_text: string;
  created_at: string;
}

interface ProjectRequirements {
  specializations: string[];
  budget_range: {
    min: number;
    max: number;
  };
  timeline: {
    start_date: string;
    duration_months: number;
  };
  location: {
    latitude: number;
    longitude: number;
    max_distance_km: number;
  };
}

interface ReviewWithRating {
  rating: number;
}

interface ReviewWithRatingAndProjectId {
  rating: number;
  project_id: string;
}

export class ContractorService {
  async registerContractor(
    userId: string,
    companyName: string,
    licenseNumber: string,
    specializations: string[],
    experienceYears: number
  ): Promise<{ contractor: Contractor | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('contractors')
        .insert({
          user_id: userId,
          company_name: companyName,
          license_number: licenseNumber,
          specializations,
          experience_years: experienceYears,
          rating: 0,
          total_reviews: 0,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      return { contractor: data, error: null };
    } catch (error) {
      return { contractor: null, error: error as Error };
    }
  }

  async getContractor(contractorId: string): Promise<Contractor | null> {
    const { data, error } = await supabase
      .from('contractors')
      .select('*')
      .eq('id', contractorId)
      .single();

    if (error) throw error;
    return data;
  }

  async submitReview(
    contractorId: string,
    reviewerId: string,
    projectId: string,
    rating: number,
    reviewText: string
  ): Promise<{ review: ContractorReview | null; error: Error | null }> {
    try {
      const { data: review, error: reviewError } = await supabase
        .from('contractor_reviews')
        .insert({
          contractor_id: contractorId,
          reviewer_id: reviewerId,
          project_id: projectId,
          rating,
          review_text: reviewText
        })
        .select()
        .single();

      if (reviewError) throw reviewError;

      const { data: reviews } = await supabase
        .from('contractor_reviews')
        .select('rating')
        .eq('contractor_id', contractorId);

      if (reviews) {
        const averageRating = reviews.reduce((sum: number, r: ReviewWithRating) => sum + r.rating, 0) / reviews.length;
        
        await supabase
          .from('contractors')
          .update({
            rating: averageRating,
            total_reviews: reviews.length
          })
          .eq('id', contractorId);
      }

      return { review, error: null };
    } catch (error) {
      return { review: null, error: error as Error };
    }
  }

  async getContractors(): Promise<Contractor[]> {
    return [
      {
        id: 'mock-contractor-id',
        user_id: 'mock-user-id',
        company_name: 'Mock Construction Co.',
        license_number: 'MOCK12345',
        specializations: ['structural', 'finishing'],
        experience_years: 10,
        rating: 4.5,
        total_reviews: 100,
        status: 'active',
      },
    ];
  }

  async getContractorReviews(contractorId: string): Promise<ContractorReview[]> {
    return [
      {
        id: 'mock-review-id',
        contractor_id: contractorId,
        reviewer_id: 'mock-reviewer-id',
        project_id: 'mock-project-id',
        rating: 5,
        review_text: 'Excellent work!',
        created_at: new Date().toISOString(),
      },
    ];
  }

  async findContractorsByRequirements(requirements: ProjectRequirements): Promise<Contractor[]> {
    return [
      {
        id: 'mock-contractor-id',
        user_id: 'mock-user-id',
        company_name: 'Mock Construction Co.',
        license_number: 'MOCK12345',
        specializations: requirements.specializations,
        experience_years: 10,
        rating: 4.5,
        total_reviews: 100,
        status: 'active',
      },
    ];
  }

  private async rankContractors(contractors: Contractor[], requirements: ProjectRequirements): Promise<Contractor[]> {
    const rankedContractors = await Promise.all(
      contractors.map(async (contractor) => {
        const score = await this.calculateMatchScore(contractor, requirements);
        return { ...contractor, matchScore: score };
      })
    );

    return rankedContractors
      .filter(c => c.matchScore >= 0.6) // Minimum match threshold
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  private async calculateMatchScore(contractor: Contractor, requirements: ProjectRequirements): Promise<number> {
    let score = 0;
    
    // Specialization match (40% weight)
    const specializationMatch = requirements.specializations.every(
      s => contractor.specializations.includes(s)
    );
    score += specializationMatch ? 0.4 : 0;

    // Rating score (30% weight)
    score += (contractor.rating / 5) * 0.3;

    // Experience score (20% weight)
    const experienceScore = Math.min(contractor.experience_years / 10, 1);
    score += experienceScore * 0.2;

    // Availability score (10% weight)
    const availabilityScore = await this.checkAvailability(contractor.id, requirements.timeline);
    score += availabilityScore * 0.1;

    return score;
  }

  private async checkAvailability(
    contractorId: string,
    timeline: ProjectRequirements['timeline']
  ): Promise<number> {
    // In a real implementation, this would check the contractor's schedule
    // and return a score based on their availability during the project timeline
    return Math.random(); // Mock availability score
  }

  async updateContractorStatus(
    contractorId: string,
    status: Contractor['status']
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase
        .from('contractors')
        .update({ status })
        .eq('id', contractorId);

      if (error) throw error;

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async getContractorAnalytics(contractorId: string): Promise<{
    totalProjects: number;
    averageRating: number;
    completionRate: number;
    specialtyDistribution: { [key: string]: number };
  }> {
    const { data: reviews } = await supabase
      .from('contractor_reviews')
      .select('rating, project_id')
      .eq('contractor_id', contractorId);

    const uniqueProjects = new Set(reviews?.map((r: ReviewWithRatingAndProjectId) => r.project_id) || []);
    const averageRating = reviews?.reduce((sum: number, r: ReviewWithRatingAndProjectId) => sum + r.rating, 0) || 0;

    const completionRate = 0.95;
    const specialtyDistribution = {
      'Residential': 0.4,
      'Commercial': 0.3,
      'Industrial': 0.2,
      'Renovation': 0.1
    };

    return {
      totalProjects: uniqueProjects.size,
      averageRating: reviews ? averageRating / reviews.length : 0,
      completionRate,
      specialtyDistribution
    };
  }
}

export const contractorService = new ContractorService();