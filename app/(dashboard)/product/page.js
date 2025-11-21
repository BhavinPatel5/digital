'use client';

import {
  SkyInput,
  SkyForm,
  SkyButton,
  SkyDialog,
  SkyTable,
} from '@sky-ui/react';
import { useShop } from '@/context/ShopContext';
import { useEffect, useRef, useState } from 'react';
import { notifyGlobal } from '../../components/NotificationProvider';
import './product.css'; // optional: add styling

export default function ProductPage() {
  const { selectedShop } = useShop();
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const dialogRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    sku: '',
    price: '',
    stock: '',
    unit: 'pcs',
    taxRate: '',
    description: '',
  });

  const fetchProducts = async () => {
    if (!selectedShop) return;
    const res = await fetch(`/api/product/list?shopId=${selectedShop._id}`);
    const data = await res.json();
    setProducts(data.products || []);
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedShop]);

  const openDialog = (product = null) => {
    setEditingProduct(product);
    if (product) {
      setForm({
        name: product.name,
        sku: product.sku,
        price: product.price,
        stock: product.stock,
        unit: product.unit,
        taxRate: product.taxRate,
        description: product.description,
      });
    } else {
      setForm({
        name: '',
        sku: '',
        price: '',
        stock: '',
        unit: 'pcs',
        taxRate: '',
        description: '',
      });
    }
    dialogRef.current?.show({ overlay: true });
  };

  const handleInput = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const body = {
      ...form,
      shopId: selectedShop?._id,
    };

    const res = await fetch(
      editingProduct ? `/api/product/${editingProduct._id}` : `/api/product/create`,
      {
        method: editingProduct ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    const json = await res.json();
    if (res.ok) {
      notifyGlobal({
  type: 'success',
  title: (editingProduct?'Product Updated':'Product Created'),
  message: (editingProduct?'Changes saved successfully.':'The product was added successfully.'),
});

      dialogRef.current?.close();
      fetchProducts();
    } else {
      notifyGlobal({
  type: 'error',
  title: 'Save Failed',
  message: json.error || 'Could not save the product.',
});
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const res = await fetch(`/api/product/${id}`, { method: 'DELETE' });
    if (res.ok) {
    notifyGlobal({
  type: 'success',
  title: 'Product Deleted',
  message: 'The product was removed.',
});
      fetchProducts();
    } else {
      notifyGlobal({
  type: 'error',
  title: 'Delete Failed',
  message: 'Could not delete the product.',
});
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'sku', label: 'SKU' },
    { key: 'price', label: 'Price' },
    { key: 'stock', label: 'Stock' },
    { key: 'unit', label: 'Unit' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="actions">
          <SkyButton size="xs" variant="light" onClick={() => openDialog(row)}>✏️</SkyButton>
          <SkyButton size="xs" variant="danger" onClick={() => handleDelete(row._id)}>🗑️</SkyButton>
        </div>
      )
    },
  ];

  return (
    <div className="product-page">
      <div className="product-page__header">
        <h2>Products</h2>
        <SkyButton onClick={() => {
  if (!selectedShop) {
notifyGlobal({
  type: 'warn',
  title: 'No Shop Selected',
  message: 'Please select a shop before adding products.',
});


    return;
  }
  openDialog();
}}>+ Add Product</SkyButton>
      </div>

      <SkyTable columns={columns} data={products} />

      <SkyDialog ref={dialogRef} title={editingProduct ? 'Edit Product' : 'New Product'} closeButton>
        <SkyForm onformSubmit={handleSubmit} formId="productForm" slot="dialog-form">
          <SkyInput placeholder="Name" value={form.name} onvalueChanged={(e) => handleInput('name', e.detail.value)} />
          <SkyInput placeholder="SKU" value={form.sku} onvalueChanged={(e) => handleInput('sku', e.detail.value)} />
          <SkyInput placeholder="Price" type="number" value={form.price} onvalueChanged={(e) => handleInput('price', e.detail.value)} />
          <SkyInput placeholder="Stock" type="number" value={form.stock} onvalueChanged={(e) => handleInput('stock', e.detail.value)} />
          <SkyInput placeholder="Unit" value={form.unit} onvalueChanged={(e) => handleInput('unit', e.detail.value)} />
          <SkyInput placeholder="Tax Rate (%)" type="number" value={form.taxRate} onvalueChanged={(e) => handleInput('taxRate', e.detail.value)} />
          <SkyInput placeholder="Description" value={form.description} onvalueChanged={(e) => handleInput('description', e.detail.value)} />
        </SkyForm>
        <SkyButton formId="productForm" slot="custom-buttons">
          {editingProduct ? 'Update' : 'Create'}
        </SkyButton>
      </SkyDialog>
    </div>
  );
}
