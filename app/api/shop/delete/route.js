import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/utils/token';
import { connectDB } from '@/lib/db';
import { Shop } from '@/models/Shop';
import mongoose from 'mongoose';

export async function DELETE(req) {
  try {
    await connectDB();

    const cookieStore =await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyAccessToken(token);
    if (!decoded) return Response.json({ error: 'Invalid token' }, { status: 401 });

    const { shopId } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      return Response.json({ error: 'Invalid shop ID' }, { status: 400 });
    }

    const shop = await Shop.findById(shopId);
    if (!shop) return Response.json({ error: 'Shop not found' }, { status: 404 });
    if (String(shop.owner) !== decoded.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Optional: prevent deletion if shop has children
    const children = await Shop.find({ parent: shop._id });
    if (children.length > 0) {
      return Response.json({ error: 'Cannot delete shop with child nodes' }, { status: 400 });
    }

    await Shop.findByIdAndDelete(shop._id);

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: 'Failed to delete shop' }, { status: 500 });
  }
}
