import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Polled by the Titroutine Focus Guard Chrome extension (extensions/chrome).
// The extension sends the site's Supabase session cookies, so this only ever
// reports on the signed-in user's own tasks.
export async function GET() {
  const headers = { 'Cache-Control': 'no-store' };
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ signedIn: false, focusing: false, task: null }, { status: 401, headers });
    }

    // updateTaskStatusAction keeps at most one task in_progress per user.
    const { data: task, error } = await supabase
      .from('tasks')
      .select('id, title, focus_duration, updated_at')
      .eq('user_id', user.id)
      .eq('status', 'in_progress')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('focus-status query error:', error);
      return NextResponse.json({ error: 'Failed to load focus status' }, { status: 500, headers });
    }

    return NextResponse.json(
      {
        signedIn: true,
        focusing: !!task,
        task: task
          ? {
              id: task.id,
              title: task.title,
              focusDuration: task.focus_duration,
              startedAt: task.updated_at,
            }
          : null,
      },
      { headers },
    );
  } catch (error) {
    console.error('focus-status error:', error);
    return NextResponse.json({ error: 'Failed to load focus status' }, { status: 500, headers });
  }
}
