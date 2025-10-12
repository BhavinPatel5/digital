import { connectDB } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/utils/token';
import { Product } from '@/models/Product';

export async function GET(req) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;

    if (!token)
      return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyAccessToken(token);
    if (!decoded)
      return Response.json({ error: 'Invalid token' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');

    if (!shopId)
      return Response.json({ error: 'Missing shopId' }, { status: 400 });

    const products = await Product.find({ shop: shopId }).lean();

    return Response.json({ products });
  } catch (err) {
    return Response.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
