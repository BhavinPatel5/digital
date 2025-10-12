'use client';

import { useEffect, useState, useRef } from 'react';
import {
  ExInput,
  ExForm,
  ExButton,
  ExDialog,
  ExCombobox,
} from '@bhavinpatel57/element-x';
import { notifyGlobal } from '../components/NotificationProvider';
import { useAuth } from '@/context/AuthContext';
import { useShop } from '@/context/ShopContext';
import './shop.css';

export default function ShopHierarchyManager() {
  const [nodes, setNodes] = useState([]);
  const [editingNode, setEditingNode] = useState(null);
  const [nodeForm, setNodeForm] = useState({ name: '', address: '', parentId: '' });
  const nodeDialogRef = useRef(null);
  const { user } = useAuth();
  const [selectedPath, setSelectedPath] = useState([]);

  // 🔁 Shop context
  const { selectedShop, setSelectedShop } = useShop();

  const handleSelectNode = (node, level) => {
    setSelectedPath(prev => [...prev.slice(0, level), node]);
  };

  const getChildren = (parentId) =>
    nodes.filter(node => {
      const nodeParentId = node.parent?._id || node.parent || '';
      return String(nodeParentId) === (parentId ?? '');
    });

  useEffect(() => {
    if (user) {
      fetchNodes();
      setSelectedPath([]);
    }
  }, [user]);

  const fetchNodes = async () => {
    try {
      const res = await fetch('/api/shop/list');
      const data = await res.json();
      if (res.ok && Array.isArray(data.shops)) {
        setNodes(data.shops);
      } else notifyGlobal(data.error || 'Failed to load nodes', 'error');
    } catch (err) {
      notifyGlobal('Error fetching nodes', 'error');
    }
  };

  const handleNodeChange = (key, value) => {
    setNodeForm(prev => ({ ...prev, [key]: value }));
  };

  const handleNodeSubmit = async () => {
    const { name, address, parentId } = nodeForm;
    const body = {
      name,
      address,
      parent: parentId || null,
    };
    if (editingNode) body.shopId = editingNode._id;

    const endpoint = editingNode ? '/api/shop/edit' : '/api/shop/create';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        notifyGlobal(editingNode ? 'Node updated' : 'Node created', 'success');
        closeNodeDialog();
        fetchNodes();
      } else {
        notifyGlobal(data.error || 'Error saving node', 'error');
      }
    } catch (err) {
      notifyGlobal('Error saving node', 'error');
    }
  };

  const handleDeleteNode = async (shopId) => {
    if (!confirm('Delete this node?')) return;
    try {
      const res = await fetch('/api/shop/delete', {
        method: 'DELETE',
        body: JSON.stringify({ shopId }),
      });
      const data = await res.json();
      if (res.ok) {
        notifyGlobal('Node deleted', 'success');
        fetchNodes();
      } else {
        notifyGlobal(data.error || 'Error deleting node', 'error');
      }
    } catch (err) {
      notifyGlobal('Error deleting node', 'error');
    }
  };

  const openEditNode = (node) => {
    setEditingNode(node);
    setNodeForm({
      name: node.name,
      address: node.address,
      parentId: node.parent || '',
    });
    nodeDialogRef.current?.show({ overlay: true });
  };

  const closeNodeDialog = () => {
    setEditingNode(null);
    nodeDialogRef.current?.close();
  };

  const renderShopCard = (node, level) => {
   const hasChildren = nodes.some(n => n.parentId === node._id);
       const isActive = selectedPath[level]?._id === node._id;

    return (
      <div
        key={node._id}
        onClick={() => handleSelectNode(node, level)}
        className={`shop-card ${isActive ? 'active' : ''}`}
      >
        <div className="flex justify-between items-center">
          <strong>{node.name}</strong>
          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
            <ExButton size="xs" variant="light" onClick={() => openEditNode(node)} title="Edit">✏️</ExButton>
            <ExButton
              size="xs"
              variant="danger"
              onClick={() =>
                hasChildren
                  ? notifyGlobal('Cannot delete: this shop has child nodes.', 'warning')
                  : handleDeleteNode(node._id)
              }
              disabled={hasChildren}
              title={hasChildren ? 'Cannot delete a parent shop' : 'Delete this shop'}
            >
              🗑️
            </ExButton>
          </div>
        </div>
        <p className="text-sm mt-2 text-gray-600">{node.address}</p>
      </div>
    );
  };

  // 🧠 Build combobox options for selecting active shop
  const shopOptions = nodes.map(shop => ({
    label: shop.name,
    value: shop._id,
  }));


  return (
    <div className="shop-manager">
      <div className="shop-manager__header">
        <h2>Shop Nodes</h2>

        <div className="flex gap-2 items-center">
          <ExCombobox
  placeholder="Select active shop"
  emittedKey="value"
  style={{ minWidth: '200px' }}
  options={shopOptions}
  value={selectedShop || ''}
  onvalueChanged={(e) => {
    const shopId = e.detail.value;
    setSelectedShop(shopId);
    const shop = nodes.find(n => n._id === shopId);
    if (shop) {
      notifyGlobal({
        type: 'info',
        title: 'Shop Selected',
        message: `You're now managing: ${shop.name}`,
      });
    }
  }}
/>
          <ExButton
            onClick={() => {
              setNodeForm({ name: '', address: '', parentId: '' });
              nodeDialogRef.current?.show({ overlay: true });
            }}
          >
            + Add Node
          </ExButton>
        </div>
      </div>

      {selectedPath.length > 0 && (
        <div className="shop-manager__breadcrumb">
          <strong>Path:</strong>{' '}
          <span className="shop-manager__breadcrumb-root" onClick={() => setSelectedPath([])}>Root</span>
          {selectedPath.map((node, i) => (
            <span key={node._id}>
              {' / '}
              <span
                className="shop-manager__breadcrumb-node"
                onClick={() => setSelectedPath(prev => prev.slice(0, i + 1))}
              >
                {node.name}
              </span>
            </span>
          ))}
        </div>
      )}

      <div className="shop-manager__columns">
        <div className="shop-column">
          <h3>Root Shops</h3>
          <div className="shop-list">
            {getChildren('').map(node => renderShopCard(node, 0))}
          </div>
        </div>

        {selectedPath.map((selectedNode, level) => (
          <div key={selectedNode._id} className="shop-column">
            <h3>{selectedNode.name} → Children</h3>
            <div className="shop-list">
              {getChildren(selectedNode._id).map(child => renderShopCard(child, level + 1))}
              {getChildren(selectedNode._id).length === 0 && (
                <div className="shop-empty">No child shops</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <ExDialog ref={nodeDialogRef} dialogPadding="10px" closeButton>
        <ExForm onformSubmit={handleNodeSubmit} slot="dialog-form" formId="nodeForm">
          <ExInput
            placeholder="Name"
            value={nodeForm.name}
            onvalueChanged={(e) => handleNodeChange('name', e.detail.value)}
          />
          <ExInput
            placeholder="Address"
            value={nodeForm.address}
            onvalueChanged={(e) => handleNodeChange('address', e.detail.value)}
          />
          <ExCombobox
            placeholder="Select parent"
            emittedKey="value"
            style={{ maxWidth: '100%' }}
            options={[
              { label: 'No Parent', value: '' },
              ...nodes
                .filter(n => !editingNode || n._id !== editingNode._id)
                .map(n => ({
                  label: n.name,
                  value: n._id,
                })),
            ]}
            value={String(nodeForm.parentId || '')}
            onvalueChanged={(e) => handleNodeChange('parentId', e.detail.value)}
          />
        </ExForm>
        <ExButton formId="nodeForm" slot="custom-buttons">
          {editingNode ? 'Update' : 'Create'}
        </ExButton>
      </ExDialog>
    </div>
  );
}
