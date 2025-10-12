import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/utils/token';
import { connectDB } from '@/lib/db';
import { Shop } from '@/models/Shop';
import mongoose from 'mongoose';

export async function POST(req) {
  try {
    await connectDB();

    const cookieStore =await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyAccessToken(token);
    if (!decoded) return Response.json({ error: 'Invalid token' }, { status: 401 });

    const { shopId, name, address, description, contactEmail, domain, parent = null } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      return Response.json({ error: 'Invalid shop ID' }, { status: 400 });
    }

    const shop = await Shop.findById(shopId);
    if (!shop) return Response.json({ error: 'Shop not found' }, { status: 404 });
    if (String(shop.owner) !== decoded.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prevent self-parenting
    if (parent && parent === shopId) {
      return Response.json({ error: 'Shop cannot be parent of itself' }, { status: 400 });
    }

    let validParent = null;
    if (parent) {
      if (!mongoose.Types.ObjectId.isValid(parent)) {
        return Response.json({ error: 'Invalid parent ID format' }, { status: 400 });
      }

      const parentShop = await Shop.findById(parent);
      if (!parentShop) return Response.json({ error: 'Parent shop not found' }, { status: 404 });
      if (String(parentShop.owner) !== decoded.id) {
        return Response.json({ error: 'Parent shop does not belong to you' }, { status: 403 });
      }

      validParent = parentShop._id;
    }

    // Update fields
    shop.name = name ?? shop.name;
    shop.address = address ?? shop.address;
    shop.description = description ?? shop.description;
    shop.domain = domain ?? shop.domain;
    shop.contactEmail = contactEmail ?? shop.contactEmail;
    shop.parent = validParent;

    await shop.save();

    return Response.json({ success: true, shop });
  } catch (err) {
    return Response.json({ error: 'Failed to update shop' }, { status: 500 });
  }
}
