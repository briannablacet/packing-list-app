import React, { useState, useEffect } from 'react';
import './App.css';
import { supabase } from './lib/supabase';
import Auth from './Auth';

// Database helper functions
const dbHelpers = {
  // Load all packing items (no user filtering, like customer_data)
  async loadPackingItems() {
    try {
      const { data, error } = await supabase
        .from('packing_items')
        .select('*')
        .order('category', { ascending: true })
        .order('items_to_pack', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading packing items:', error);
      alert('Error loading items from database');
      return [];
    }
  },

  // Save a new packing item
  async savePackingItem(item) {
    try {
      const { data, error } = await supabase
        .from('packing_items')
        .insert([{
          id_flag: item.id_flag,
          bring_flag: item.bring_flag,
          packed_flag: item.packed_flag,
          items_to_pack: item.items_to_pack,
          category: item.category,
          notes: item.notes
        }])
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error saving packing item:', error);
      alert('Error saving item to database');
      return null;
    }
  },

  // Update an existing packing item
  async updatePackingItem(item) {
    try {
      const { data, error } = await supabase
        .from('packing_items')
        .update({
          id_flag: item.id_flag,
          bring_flag: item.bring_flag,
          packed_flag: item.packed_flag,
          items_to_pack: item.items_to_pack,
          category: item.category,
          notes: item.notes
        })
        .eq('id', item.id)
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error updating packing item:', error);
      alert('Error updating item in database');
      return null;
    }
  },

  // Delete packing items
  async deletePackingItems(ids) {
    try {
      const { error } = await supabase
        .from('packing_items')
        .delete()
        .in('id', ids);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting packing items:', error);
      alert('Error deleting items from database');
      return false;
    }
  },

  // Bulk insert (for CSV imports)
  async bulkInsertPackingItems(items) {
    try {
      const formattedItems = items.map(item => ({
        id_flag: item.ID || item.id_flag || 'Yes',
        bring_flag: item['Bring?'] || item.bring_flag || 'NO',
        packed_flag: item['Packed?'] || item.packed_flag || 'NO',
        items_to_pack: item['Items to Pack'] || item.items_to_pack,
        category: item.Category || item.category || 'Misc',
        notes: item.Notes || item.notes || ''
      }));

      const { data, error } = await supabase
        .from('packing_items')
        .insert(formattedItems)
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error bulk inserting packing items:', error);
      alert('Error importing items to database');
      return [];
    }
  }
};

// Add/Edit Item Form Component
const ItemForm = ({ onSave, onCancel, editingItem }) => {
  const [formData, setFormData] = useState({
    id_flag: editingItem?.id_flag || 'Yes',
    bring_flag: editingItem?.bring_flag || 'NO',
    packed_flag: editingItem?.packed_flag || 'NO',
    items_to_pack: editingItem?.items_to_pack || '',
    category: editingItem?.category || '',
    notes: editingItem?.notes || ''
  });

  const categories = [
    'Electronics', 'Toiletries', 'Clothing', 'Outerwear', 'Underwear', 
    'Shoes', 'Accessories', 'Misc', 'To Do', 'Cosmetics', 'Dive Gear', 
    'Tops', 'Bottoms', 'Dress-Up Clothes', 'Socks'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.items_to_pack.trim()) {
      alert('Please enter an item name');
      return;
    }
    if (!formData.category.trim()) {
      alert('Please select a category');
      return;
    }
    
    onSave({
      ...editingItem,
      ...formData
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
          <button onClick={onCancel} className="close-button">×</button>
        </div>
        <form onSubmit={handleSubmit} className="form-container">
          <div className="form-group">
            <label htmlFor="items_to_pack">Items to Pack *</label>
            <input
              id="items_to_pack"
              type="text"
              value={formData.items_to_pack}
              onChange={(e) => setFormData({ ...formData, items_to_pack: e.target.value })}
              className="form-input"
              placeholder="e.g. Airpods, Toothbrush, T-shirts"
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="form-input"
                required
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="id_flag">ID</label>
              <select
                id="id_flag"
                value={formData.id_flag}
                onChange={(e) => setFormData({ ...formData, id_flag: e.target.value })}
                className="form-input"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="">Empty</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="form-input"
              placeholder="Optional notes"
              rows="2"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="bring_flag">Bring?</label>
              <select
                id="bring_flag"
                value={formData.bring_flag}
                onChange={(e) => setFormData({ ...formData, bring_flag: e.target.value })}
                className="form-input"
              >
                <option value="YES">YES</option>
                <option value="NO">NO</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="packed_flag">Packed?</label>
              <select
                id="packed_flag"
                value={formData.packed_flag}
                onChange={(e) => setFormData({ ...formData, packed_flag: e.target.value })}
                className="form-input"
              >
                <option value="YES">YES</option>
                <option value="NO">NO</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingItem ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmationModal = ({ items, onConfirm, onCancel }) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <div className="modal-header">
        <h2>Confirm Deletion</h2>
        <button onClick={onCancel} className="close-button">×</button>
      </div>
      <div className="form-container">
        <div className="delete-confirmation-content">
          <div className="warning-icon">⚠️</div>
          <h3>Are you sure you want to delete {items.length} item{items.length > 1 ? 's' : ''}?</h3>
          <ul className="delete-list">
            {items.slice(0, 5).map(item => (
              <li key={item.id}>
                <strong>{item.items_to_pack}</strong> ({item.category})
              </li>
            ))}
            {items.length > 5 && <li>... and {items.length - 5} more items</li>}
          </ul>
          <p className="warning-text">This action cannot be undone.</p>
        </div>
        <div className="form-actions">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button onClick={onConfirm} className="btn-danger">
            🗑️ Delete {items.length} Item{items.length > 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [packingItems, setPackingItems] = useState([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Authentication state management
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_OUT') {
        setPackingItems([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load data when user changes
  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const data = await dbHelpers.loadPackingItems();
      setPackingItems(data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories from data
  const categories = [...new Set(packingItems.map(item => item.category))].sort();

  // Filter items
  const filteredItems = packingItems.filter(item => {
    const matchesSearch = item.items_to_pack.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Statistics
  const stats = {
    total: packingItems.length,
    bring: packingItems.filter(item => item.bring_flag === 'YES').length,
    packed: packingItems.filter(item => item.packed_flag === 'YES').length,
    percentage: packingItems.filter(item => item.bring_flag === 'YES').length > 0 
      ? Math.round((packingItems.filter(item => item.packed_flag === 'YES').length / packingItems.filter(item => item.bring_flag === 'YES').length) * 100)
      : 0
  };

  const handleAddItem = async (itemData) => {
    const newItem = await dbHelpers.savePackingItem(itemData);
    if (newItem) {
      setPackingItems([...packingItems, newItem]);
      setShowItemForm(false);
      setEditingItem(null);
    }
  };

  const handleUpdateItem = async (itemData) => {
    const updatedItem = await dbHelpers.updatePackingItem(itemData);
    if (updatedItem) {
      setPackingItems(packingItems.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      ));
      setShowItemForm(false);
      setEditingItem(null);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setShowItemForm(true);
  };

  const handleDeleteItems = (itemsToDelete) => {
    setDeleteConfirmation(itemsToDelete);
  };

  const confirmDelete = async () => {
    const ids = deleteConfirmation.map(item => item.id);
    const success = await dbHelpers.deletePackingItems(ids);
    if (success) {
      setPackingItems(packingItems.filter(item => !ids.includes(item.id)));
      setSelectedItems(new Set());
    }
    setDeleteConfirmation(null);
  };

  const handleQuickToggle = async (item, field) => {
    let updatedItem;
    if (field === 'bring_flag') {
      updatedItem = { ...item, bring_flag: item.bring_flag === 'YES' ? 'NO' : 'YES' };
    } else if (field === 'packed_flag') {
      updatedItem = { ...item, packed_flag: item.packed_flag === 'YES' ? 'NO' : 'YES' };
    }
    
    const result = await dbHelpers.updatePackingItem(updatedItem);
    if (result) {
      setPackingItems(packingItems.map(i => i.id === item.id ? result : i));
    }
  };

  const handleItemSelection = (itemId) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const selectAllVisible = () => {
    setSelectedItems(new Set(filteredItems.map(item => item.id)));
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const handleBulkDelete = () => {
    const itemsToDelete = packingItems.filter(item => selectedItems.has(item.id));
    handleDeleteItems(itemsToDelete);
  };

  // CSV Export - using EXACT field names from user's CSV
  const exportToCSV = () => {
    const csvContent = [
      'ID,Bring?,Packed?,Items to Pack,Category,Notes',
      ...packingItems.map(item => 
        `"${item.id_flag || ''}","${item.bring_flag}","${item.packed_flag}","${item.items_to_pack}","${item.category}","${item.notes}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `packing-list-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // CSV Import
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        
        const itemsToImport = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
          const itemData = {};
          
          headers.forEach((header, index) => {
            itemData[header] = values[index] || '';
          });
          
          if (itemData['Items to Pack']) {
            itemsToImport.push(itemData);
          }
        }
        
        if (itemsToImport.length > 0) {
          const imported = await dbHelpers.bulkInsertPackingItems(itemsToImport);
          if (imported.length > 0) {
            setPackingItems([...packingItems, ...imported]);
            alert(`✅ Imported ${imported.length} items successfully!`);
          }
        }
        
      } catch (error) {
        console.error('CSV parsing error:', error);
        alert('Error parsing CSV file');
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  if (!user) {
    return <Auth onAuthSuccess={setUser} />;
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your packing lists...</p>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <div className="app-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🎒 PackTrack</h1>
            <p>Smart Packing Lists</p>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-email">{user.email}</span>
              <button 
                onClick={() => supabase.auth.signOut()} 
                className="btn-logout"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {packingItems.length > 0 && (
        <div className="stats-bar">
          <div className="stat">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total Items</span>
          </div>
          <div className="stat">
            <span className="stat-number">{stats.bring}</span>
            <span className="stat-label">To Bring</span>
          </div>
          <div className="stat">
            <span className="stat-number">{stats.packed}</span>
            <span className="stat-label">Packed</span>
          </div>
          <div className="stat">
            <span className="stat-number">{stats.percentage}%</span>
            <span className="stat-label">Complete</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="main-content">
        {/* Action Bar */}
        <div className="action-bar">
          <div className="action-bar-left">
            <button 
              onClick={() => setShowItemForm(true)}
              className="btn-primary"
            >
              ➕ Add Item
            </button>
            <button onClick={exportToCSV} className="btn-secondary">
              📥 Export CSV
            </button>
            <label className="btn-secondary file-upload-btn">
              📤 Import CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="search-section">
          <div className="search-controls">
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="select-input"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Bulk Actions */}
          {filteredItems.length > 0 && (
            <div className="bulk-actions">
              <div className="bulk-selection-info">
                {selectedItems.size > 0 ? (
                  <span className="selection-count">
                    {selectedItems.size} of {filteredItems.length} items selected
                  </span>
                ) : (
                  <span className="selection-count">
                    {filteredItems.length} items found
                  </span>
                )}
              </div>
              
              <div className="bulk-action-buttons">
                {selectedItems.size === 0 ? (
                  <button onClick={selectAllVisible} className="btn-bulk-select">
                    Select All Visible
                  </button>
                ) : (
                  <>
                    <button onClick={clearSelection} className="btn-bulk-clear">
                      Clear Selection
                    </button>
                    <button onClick={handleBulkDelete} className="btn-bulk-delete">
                      🗑️ Delete Selected ({selectedItems.size})
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="results-container">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="no-results">
              <p>No results found. Try adjusting your search or add some items.</p>
              {packingItems.length === 0 && (
                <p>💡 Import your CSV file or add items to get started!</p>
              )}
            </div>
          ) : (
            filteredItems.map(item => (
              <div 
                key={item.id} 
                className={`result-card ${selectedItems.has(item.id) ? 'selected' : ''} ${item.packed_flag === 'YES' ? 'packed' : ''}`}
                onClick={() => handleEditItem(item)}
              >
                <div className="result-header">
                  <div className="result-header-left">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleItemSelection(item.id)}
                      className="record-checkbox"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <h3 className="result-title">{item.items_to_pack}</h3>
                      <div className="result-meta">
                        {item.category} • ID: {item.id_flag || 'Empty'}
                      </div>
                    </div>
                  </div>
                  <div className="result-header-right">
                    <div className="quick-toggles">
                      <label className="quick-toggle" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={item.bring_flag === 'YES'}
                          onChange={() => handleQuickToggle(item, 'bring_flag')}
                        />
                        Bring?
                      </label>
                      <label className="quick-toggle" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={item.packed_flag === 'YES'}
                          onChange={() => handleQuickToggle(item, 'packed_flag')}
                        />
                        Packed?
                      </label>
                    </div>
                  </div>
                </div>

                {item.notes && (
                  <p className="result-summary">{item.notes}</p>
                )}
                
                <div className="result-footer">
                  <div className="action-buttons">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditItem(item);
                      }}
                      className="btn-edit"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItems([item]);
                      }}
                      className="btn-delete"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      {showItemForm && (
        <ItemForm
          onSave={editingItem ? handleUpdateItem : handleAddItem}
          onCancel={() => {
            setShowItemForm(false);
            setEditingItem(null);
          }}
          editingItem={editingItem}
        />
      )}

      {deleteConfirmation && (
        <DeleteConfirmationModal
          items={deleteConfirmation}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirmation(null)}
        />
      )}
    </div>
  );
};

export default App;