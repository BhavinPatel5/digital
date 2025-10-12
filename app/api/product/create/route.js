import { connectDB } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/utils/token';
import { Product } from '@/models/Product';

export async function POST(req) {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;

    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();

    const {
      shopId,
      name,
      sku,
      price,
      taxRate,
      unit,
      stock,
      description,
    } = body;

    if (!shopId || !name || price == null) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const product = await Product.create({
      shop: shopId,
      name,
      sku,
      price,
      taxRate,
      unit,
      stock,
      description,
    });


    return Response.json({ success: true, product });
  } catch (err) {
    return Response.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
