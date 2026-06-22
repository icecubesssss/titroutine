import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getDashboard } from '@/lib/data';

export async function POST(request: Request) {
  try {
    // Only a signed-in user can trigger a report, and the stats come from the
    // database — never from the request body — so they can't be spoofed.
    const dashboard = await getDashboard();
    if (!dashboard) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('Missing RESEND_API_KEY');
      return NextResponse.json({ error: 'Server configuration error: Missing API Key' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === 'string' && body.email.trim() ? body.email.trim() : dashboard.email;
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const streak = dashboard.profile.currentStreak;
    const coins = dashboard.profile.coins;
    const totalHabits = dashboard.habits.length;
    const habitsCompleted = dashboard.habits.filter((h) => h.isCompleted).length;
    const isEgg = dashboard.profile.petStage < 1;

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: 'Titroutine <onboarding@resend.dev>', // Resend free-tier default sender
      to: email,
      subject: `🐰 Your Daily Titroutine Report - ${streak} Days Streak!`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; background-color: #FDFBF7; padding: 20px; border-radius: 16px; border: 2px solid #E5E7EB;">
          <h2 style="color: #8B4513; text-align: center;">Daily Habit Report</h2>
          <p style="text-align: center; font-size: 16px; color: #4B4B4B;">
            Great job today! Here is your summary:
          </p>

          <div style="background-color: white; padding: 16px; border-radius: 12px; margin: 20px 0;">
            <ul style="list-style-type: none; padding: 0; margin: 0; font-size: 16px;">
              <li style="margin-bottom: 10px;">🔥 <strong>Current Streak:</strong> ${streak} Days</li>
              <li style="margin-bottom: 10px;">💰 <strong>Coins:</strong> ${coins}</li>
              <li style="margin-bottom: 10px;">✅ <strong>Habits Completed:</strong> ${habitsCompleted} / ${totalHabits}</li>
              <li>🐾 <strong>Pet Status:</strong> ${isEgg ? 'Cozy Egg' : 'Hopping Bunny'}</li>
            </ul>
          </div>

          <p style="text-align: center; color: #9CA3AF; font-size: 14px;">
            Keep up the good work and see you tomorrow! <br/>
            - Your Virtual Pet 🐰
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend delivery error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Resend API Error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
