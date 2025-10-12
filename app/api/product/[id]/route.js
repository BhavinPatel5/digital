import { connectDB } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/utils/token';
import { Product } from '@/models/Product';
import mongoose from 'mongoose';

export async function GET(_, { params }) {
  try {
    await connectDB();
    const productId = params.id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return Response.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const product = await Product.findById(productId).lean();
    if (!product) return Response.json({ error: 'Product not found' }, { status: 404 });

    return Response.json({ product });
  } catch (err) {
    return Response.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const productId = params.id;
    const cookieStore = cookies();
    const token = cookieStore.get('accessToken')?.value;

    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token);
    if (!decoded) return Response.json({ error: 'Invalid token' }, { status: 401 });

    const update = await req.json();

    const product = await Product.findById(productId);
    if (!product) return Response.json({ error: 'Product not found' }, { status: 404 });

    // Optional: restrict update to owner of the shop
    product.set(update);
    await product.save();

    return Response.json({ success: true, product });
  } catch (err) {
    return Response.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(_, { params }) {
  try {
    await connectDB();
    const productId = params.id;
    const cookieStore = cookies();
    const token = cookieStore.get('accessToken')?.value;

    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token);
    if (!decoded) return Response.json({ error: 'Invalid token' }, { status: 401 });

    const deleted = await Product.findByIdAndDelete(productId);
    if (!deleted) return Response.json({ error: 'Product not found' }, { status: 404 });

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
