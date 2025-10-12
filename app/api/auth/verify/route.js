import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { PendingUser } from '@/models/PendingUser';
import { hashToken } from '@/utils/emailVerification';

export async function POST(request) {
  await connectDB();
  const { userId, otp } = await request.json();

  if (!userId || !otp) {
    return Response.json({ error: 'Missing OTP or user ID' }, { status: 400 });
  }

  const hashedToken = hashToken(otp);

  try {
    // First check pending users
    const pendingUser = await PendingUser.findOne({
      _id: userId,
      emailVerifyToken: hashedToken,
      emailVerifyTokenExpires: { $gt: Date.now() }
    });

    if (pendingUser) {
      // Create new verified user
      const newUser = await User.create({
        email: pendingUser.email,
        password: pendingUser.password,
        name: pendingUser.name,
        provider: 'credentials',
        isVerified: true,
        role: pendingUser.role || 'user'
      });

      // Delete pending user
      await PendingUser.deleteOne({ _id: userId });

      return Response.json({ 
        message: 'Account verified successfully',
        user: {
          id: newUser._id,
          email: newUser.email,
          name: newUser.name
        }
      });
    }

    // Check regular users
    const user = await User.findOne({
      _id: userId,
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return Response.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    // Mark user as verified
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    return Response.json({ 
      message: 'Email verified successfully',
      user: {
        id: user._id,
        email: user.email
      }
    });
  } catch (error) {
    return Response.json({ error: 'Verification failed' }, { status: 500 });
  }
}