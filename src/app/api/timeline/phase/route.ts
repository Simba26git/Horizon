import { NextResponse } from 'next/server';
import { TimelinePlannerService } from '../../../../services/TimelinePlannerService';

export async function PATCH(request: Request) {
  try {
    const { phase_id, status } = await request.json();

    if (!phase_id || !status) {
      return NextResponse.json(
        { error: 'Phase ID and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'in_progress', 'completed', 'delayed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    const updatedPhase = await TimelinePlannerService.updatePhaseStatus(
      phase_id,
      status
    );
    return NextResponse.json(updatedPhase);
  } catch (error) {
    console.error('Error updating phase status:', error);
    return NextResponse.json(
      { error: 'Failed to update phase status' },
      { status: 500 }
    );
  }
} 