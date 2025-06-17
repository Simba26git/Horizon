import { supabase } from '@/lib/supabaseClient';

interface ProjectPhase {
  id: string;
  name: string;
  description: string;
  duration: number; // in days
  dependencies: string[]; // IDs of phases that must be completed first
  materials: string[]; // Material IDs needed for this phase
}

interface Timeline {
  id: string;
  project_id: string;
  phases: ProjectPhase[];
  start_date: string;
  estimated_end_date: string;
  actual_end_date?: string;
  status: 'planning' | 'in_progress' | 'completed' | 'delayed';
  weather_delays: number; // in days
  current_phase_id: string;
}

interface MaterialDelivery {
  material_id: string;
  quantity: number;
  scheduled_date: string;
  phase_id: string;
  supplier_id: string;
  status: 'scheduled' | 'delivered' | 'delayed';
}

export class TimelinePlannerService {
  private readonly DEFAULT_PHASES: Omit<ProjectPhase, 'id'>[] = [
    {
      name: 'Site Preparation',
      description: 'Clear the site, excavation, and initial groundwork',
      duration: 7,
      dependencies: [],
      materials: []
    },
    {
      name: 'Foundation',
      description: 'Laying the foundation and curing',
      duration: 14,
      dependencies: ['site_preparation'],
      materials: ['cement', 'steel', 'aggregate']
    },
    {
      name: 'Structural Work',
      description: 'Frame construction and main structure',
      duration: 30,
      dependencies: ['foundation'],
      materials: ['steel', 'concrete', 'blocks']
    },
    {
      name: 'Roofing',
      description: 'Roof installation and waterproofing',
      duration: 10,
      dependencies: ['structural_work'],
      materials: ['roofing_sheets', 'waterproofing']
    },
    {
      name: 'Interior Work',
      description: 'Internal walls, flooring, and basic finishing',
      duration: 21,
      dependencies: ['roofing'],
      materials: ['tiles', 'paint', 'drywall']
    },
    {
      name: 'MEP Installation',
      description: 'Mechanical, electrical, and plumbing work',
      duration: 14,
      dependencies: ['structural_work'],
      materials: ['electrical_supplies', 'plumbing_supplies']
    },
    {
      name: 'Finishing',
      description: 'Final touches and cleanup',
      duration: 10,
      dependencies: ['interior_work', 'mep_installation'],
      materials: ['paint', 'fixtures']
    }
  ];

  async getProjectTimeline(projectId: string): Promise<Timeline> {
    // Mock data for demo purposes
    const mockTimeline: Timeline = {
      id: `timeline-${projectId}`,
      project_id: projectId,
      phases: [
        {
          id: 'phase-1',
          name: 'Site Preparation',
          description: 'Clear the site, excavation, and initial groundwork',
          duration: 7,
          dependencies: [],
          materials: []
        },
        {
          id: 'phase-2',
          name: 'Foundation',
          description: 'Laying the foundation and curing',
          duration: 14,
          dependencies: ['phase-1'],
          materials: ['cement', 'steel', 'aggregate']
        },
        {
          id: 'phase-3',
          name: 'Structural Work',
          description: 'Constructing walls, columns, and beams',
          duration: 30,
          dependencies: ['phase-2'],
          materials: ['bricks', 'steel', 'cement']
        }
      ],
      start_date: new Date().toISOString().split('T')[0],
      estimated_end_date: new Date(Date.now() + 51 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'planning',
      weather_delays: 0,
      current_phase_id: 'phase-1'
    };

    return mockTimeline;
  }

  static async updatePhaseStatus(
    phaseId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'delayed'
  ) {
    const { data, error } = await supabase
      .from('timeline_phases')
      .update({ status })
      .eq('id', phaseId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async reportWeatherDelay(timelineId: string, delayDays: number) {
    const { data: timeline, error: fetchError } = await supabase
      .from('timelines')
      .select('weather_delays')
      .eq('id', timelineId)
      .single();

    if (fetchError) throw fetchError;

    const { data, error } = await supabase
      .from('timelines')
      .update({
        weather_delays: (timeline?.weather_delays || 0) + delayDays,
        estimated_end_date: new Date(Date.now() + delayDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      })
      .eq('id', timelineId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async createTimeline(projectId: string, phases: any[]) {
    const { data: timeline, error: timelineError } = await supabase
      .from('timelines')
      .insert({
        project_id: projectId,
        status: 'planning',
        weather_delays: 0,
        start_date: new Date().toISOString(),
        estimated_end_date: this.calculateEstimatedEndDate(phases)
      })
      .select()
      .single();

    if (timelineError) throw timelineError;

    const phasesWithTimeline = phases.map(phase => ({
      ...phase,
      timeline_id: timeline.id
    }));

    const { data: createdPhases, error: phasesError } = await supabase
      .from('timeline_phases')
      .insert(phasesWithTimeline)
      .select();

    if (phasesError) throw phasesError;

    return {
      ...timeline,
      phases: createdPhases
    };
  }

  private static calculateEstimatedEndDate(phases: any[]) {
    const totalDuration = phases.reduce((sum, phase) => sum + phase.duration, 0);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + totalDuration);
    return endDate.toISOString();
  }

  async scheduleMaterialDeliveries(timelineId: string): Promise<MaterialDelivery[]> {
    const { data: timeline } = await supabase
      .from('timelines')
      .select(`
        *,
        phases:project_phases (
          id,
          name,
          materials,
          duration
        )
      `)
      .eq('id', timelineId)
      .single();

    if (!timeline) return [];

    const deliveries: MaterialDelivery[] = [];
    const startDate = new Date(timeline.start_date);

    for (const phase of timeline.phases) {
      // Schedule deliveries 2 days before phase starts
      const deliveryDate = new Date(startDate);
      deliveryDate.setDate(deliveryDate.getDate() + this.getPhaseStartDay(phase, new Map(), new Set()) - 2);

      for (const materialId of phase.materials) {
        // Get best supplier based on delivery time and price
        const { data: supplier } = await supabase
          .from('material_prices')
          .select(`
            supplier_id,
            suppliers (
              id,
              delivery_time
            )
          `)
          .eq('material_id', materialId)
          .order('price', { ascending: true })
          .limit(1)
          .single();

        if (supplier) {
          deliveries.push({
            material_id: materialId,
            quantity: this.calculateRequiredQuantity(materialId, phase.duration),
            scheduled_date: deliveryDate.toISOString(),
            phase_id: phase.id,
            supplier_id: supplier.supplier_id,
            status: 'scheduled'
          });
        }
      }
    }

    // Save deliveries to database
    await supabase
      .from('material_deliveries')
      .insert(deliveries);

    return deliveries;
  }

  private calculateRequiredQuantity(materialId: string, duration: number): number {
    // This would normally use more sophisticated calculations based on
    // project specifications, but for now we'll use a simple estimate
    return duration * 10; // Basic estimation
  }

  async updateProgress(timelineId: string, completedPhaseId: string): Promise<void> {
    const { data: timeline } = await supabase
      .from('timelines')
      .select('*')
      .eq('id', timelineId)
      .single();

    if (!timeline) return;

    const phaseIndex = timeline.phases.indexOf(completedPhaseId);
    const nextPhaseId = timeline.phases[phaseIndex + 1];

    await supabase
      .from('timelines')
      .update({
        current_phase_id: nextPhaseId || completedPhaseId,
        status: nextPhaseId ? 'in_progress' : 'completed',
        actual_end_date: nextPhaseId ? null : new Date().toISOString()
      })
      .eq('id', timelineId);
  }

  async reportDelay(timelineId: string, days: number, reason: string): Promise<void> {
    const { data: timeline } = await supabase
      .from('timelines')
      .select('*')
      .eq('id', timelineId)
      .single();

    if (!timeline) return;

    const newEndDate = new Date(timeline.estimated_end_date);
    newEndDate.setDate(newEndDate.getDate() + days);

    await supabase
      .from('timelines')
      .update({
        estimated_end_date: newEndDate.toISOString(),
        weather_delays: timeline.weather_delays + (reason === 'weather' ? days : 0),
        status: 'delayed'
      })
      .eq('id', timelineId);

    // Reschedule affected deliveries
    await this.rescheduleMaterialDeliveries(timelineId, days);
  }

  private async rescheduleMaterialDeliveries(timelineId: string, delayDays: number): Promise<void> {
    const { data: deliveries } = await supabase
      .from('material_deliveries')
      .select('*')
      .eq('timeline_id', timelineId)
      .gte('scheduled_date', new Date().toISOString());

    if (!deliveries) return;

    for (const delivery of deliveries) {
      const newDate = new Date(delivery.scheduled_date);
      newDate.setDate(newDate.getDate() + delayDays);

      await supabase
        .from('material_deliveries')
        .update({
          scheduled_date: newDate.toISOString()
        })
        .eq('id', delivery.id);
    }
  }

  private calculateEndDate(startDate: string, phases: ProjectPhase[]): string {
    let totalDays = 0;
    const phaseMap = new Map(phases.map(p => [p.id, p]));
    const completed = new Set<string>();
    const queue = [...phases];

    while (queue.length > 0) {
      const phase = queue.shift();
      if (!phase) continue;

      const dependencies = phase.dependencies.filter(d => !completed.has(d));
      if (dependencies.length > 0) {
        queue.push(phase);
        continue;
      }

      totalDays = Math.max(
        totalDays,
        this.getPhaseStartDay(phase, phaseMap, completed) + phase.duration
      );
      completed.add(phase.id);
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + totalDays);
    return endDate.toISOString();
  }

  private getPhaseStartDay(
    phase: ProjectPhase,
    phaseMap: Map<string, ProjectPhase>,
    completed: Set<string>
  ): number {
    if (phase.dependencies.length === 0) return 0;

    return Math.max(
      ...phase.dependencies.map(d => {
        const dep = phaseMap.get(d);
        if (!dep || !completed.has(d)) return 0;
        return this.getPhaseStartDay(dep, phaseMap, completed) + dep.duration;
      })
    );
  }
}

export const timelinePlannerService = new TimelinePlannerService();