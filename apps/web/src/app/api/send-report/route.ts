import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("Missing RESEND_API_KEY");
      return NextResponse.json({ error: 'Server configuration error: Missing API Key' }, { status: 500 });
    }
    
    const resend = new Resend(apiKey);
    
    const { email, streak, coins, habitsCompleted, totalHabits, petStage } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: 'Titroutine <onboarding@resend.dev>', // Mặc định của Resend cho free tier
      to: email, // Chỉ gửi được cho email đã đăng ký Resend ở free tier
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
              <li style="margin-bottom: 10px;">💰 <strong>Coins Earned:</strong> ${coins}</li>
              <li style="margin-bottom: 10px;">✅ <strong>Habits Completed:</strong> ${habitsCompleted} / ${totalHabits}</li>
              <li>🐾 <strong>Pet Status:</strong> ${petStage === 'rabbit' ? 'Hopping Bunny' : 'Cozy Egg'}</li>
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
      console.error("Resend delivery error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Resend API Error:", error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
