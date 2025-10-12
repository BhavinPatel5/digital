import { OAuth2Client } from 'google-auth-library';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { generateAccessToken, generateRefreshToken } from '@/utils/token';
import { setRefreshCookie } from '@/utils/cookies';
import { cookies } from 'next/headers';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(req) {
  try {
    await connectDB();

    const { token: idToken } = await req.json();
    if (!idToken) {
      return Response.json({ error: 'Missing Google token' }, { status: 400 });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return Response.json({ error: 'Invalid Google token' }, { status: 401 });
    }

    const { email, name } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        name,
        provider: 'google',
        isVerified: true,
      });
    } else if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const cookieStore = await cookies(); // ✅ Must await here

    cookieStore.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 15, // 15 minutes
    });

    await setRefreshCookie(refreshToken); // This uses `await cookies()` too, which is good

    return Response.json({
      message: 'Google login successful',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    return Response.json({ error: 'Google login failed' }, { status: 500 });
  }
}
