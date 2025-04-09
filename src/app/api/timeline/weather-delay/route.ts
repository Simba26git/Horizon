import { NextResponse } from 'next/server';
import { TimelinePlannerService } from '../../../../services/TimelinePlannerService';

export async function POST(request: Request) {
  try {
    const { timeline_id, delay_days } = await request.json();

    if (!timeline_id || typeof delay_days !== 'number' || delay_days <= 0) {
      return NextResponse.json(
        { error: 'Timeline ID and positive delay days are required' },
        { status: 400 }
      );
    }

    const updatedTimeline = await TimelinePlannerService.reportWeatherDelay(
      timeline_id,
      delay_days
    );
    return NextResponse.json(updatedTimeline);
  } catch (error) {
    console.error('Error reporting weather delay:', error);
    return NextResponse.json(
      { error: 'Failed to report weather delay' },
      { status: 500 }
    );
  }
} 