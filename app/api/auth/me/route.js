// app/api/auth/me/route.js
import { cookies } from 'next/headers';
import { verifyAccessToken, verifyRefreshToken } from '@/utils/token';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { generateAccessToken } from '@/utils/token';

export async function GET() {
  try {
    await connectDB();
    const cookieStore = await cookies();
    
    // 1. Check access token first
    const accessToken = cookieStore.get('accessToken')?.value;
    if (accessToken) {
      const decoded = verifyAccessToken(accessToken);
      if (decoded) {
        const user = await User.findById(decoded.id).select('-password');
        if (user) return Response.json({ user });
      }
    }

    // 2. If access token invalid/expired, try refresh token
    const refreshToken = cookieStore.get('refreshToken')?.value;
    if (refreshToken) {
      const decodedRefresh = verifyRefreshToken(refreshToken);
      if (decodedRefresh) {
        const user = await User.findById(decodedRefresh.id);
        if (user) {
          const newAccessToken = generateAccessToken(user);
          
          // Set new access token cookie - FIXED: Use await with cookies()
          const response = Response.json({ 
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
              isVerified: user.isVerified
            }
          });

          // Set the cookie on the response
          response.cookies.set({
            name: 'accessToken',
            value: newAccessToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 15 // 15 minutes
          });

          return response;
        }
      }
    }

    return Response.json({ user: null }, { status: 401 });
  } catch (err) {
    return Response.json({ error: 'Session check failed' }, { status: 500 });
  }
}