import { NextResponse } from 'next/server';
import { TimelinePlannerService } from '../../../../services/TimelinePlannerService';

export async function GET(request: Request) {
  try {
    // Get project_id from query params
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const timeline = await TimelinePlannerService.getCurrentTimeline(projectId);
    return NextResponse.json(timeline);
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline' },
      { status: 500 }
    );
  }
} 