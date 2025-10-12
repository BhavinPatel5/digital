import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/utils/token';
import { connectDB } from '@/lib/db';
import { Shop } from '@/models/Shop';

export async function GET() {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;

    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyAccessToken(token);
    if (!decoded) return Response.json({ error: 'Invalid token' }, { status: 401 });

    // ✅ Do NOT populate parent
    const shops = await Shop.find({ owner: decoded.id }).lean();

    // ✅ Normalize parent to string _id or null
    const normalized = shops.map(shop => ({
      ...shop,
      parent: typeof shop.parent === 'object' && shop.parent !== null
        ? shop.parent._id
        : shop.parent ?? null,
    }));

    return Response.json({ shops: normalized });
  } catch (err) {
    return Response.json({ error: 'Failed to fetch shops' }, { status: 500 });
  }
}
