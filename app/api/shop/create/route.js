import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/utils/token';
import { connectDB } from '@/lib/db';
import { Shop } from '@/models/Shop';
import mongoose from 'mongoose';

export async function POST(req) {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;

    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyAccessToken(token);

    if (!decoded) return Response.json({ error: 'Invalid token' }, { status: 401 });

    const body = await req.json();
    const { name, description, domain, contactEmail, address, parent = null } = body;

    // ✅ Validate parent shop if provided
    let validParent = null;
    if (parent) {
      if (!mongoose.Types.ObjectId.isValid(parent)) {
        return Response.json({ error: 'Invalid parent ID format' }, { status: 400 });
      }

      const parentShop = await Shop.findById(parent);
      if (!parentShop) {
        return Response.json({ error: 'Parent shop not found' }, { status: 404 });
      }

      if (String(parentShop.owner) !== decoded.id) {
        return Response.json({ error: 'Parent shop does not belong to you' }, { status: 403 });
      }

      validParent = parentShop._id;
    }

    const shop = await Shop.create({
      name,
      description,
      domain,
      contactEmail,
      address,
      owner: decoded.id,
      parent: validParent,
    });


    return Response.json({ success: true, shop });
  } catch (err) {
    return Response.json({ error: 'Failed to create shop' }, { status: 500 });
  }
}
