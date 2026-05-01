import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('master');
  const [searchTerm, setSearchTerm] = useState('');

  // Add new item state
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemNotes, setNewItemNotes] = useState('');

  // Edit states
  const [editingNotes, setEditingNotes] = useState(null);
  const [editNotesText, setEditNotesText] = useState('');
  const [editingName, setEditingName] = useState(null);
  const [editNameText, setEditNameText] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryText, setEditCategoryText] = useState('');

  // Load data from database on startup; add sorting
  useEffect(() => {
    loadItemsFromDatabase();
  }, []);

  const loadItemsFromDatabase = async () => {
    try {
      const { data, error } = await supabase
        .from('packing_items')
        .select('*')
        .order('category', { ascending: true })
        .order('items_to_pack', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading items:', error);
      alert('Error loading items from database');
    } finally {
      setLoading(false);
    }
  };

  const updateItemInDatabase = async (item) => {
    try {
      const { error } = await supabase
        .from('packing_items')
        .update({
          bring_flag: item.bring_flag,
          packed_flag: item.packed_flag,
          notes: item.notes,
          items_to_pack: item.items_to_pack,
          category: item.category
        })
        .eq('id', item.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Error updating item in database');
    }
  };

  // Delete individual item
  const deleteItem = async (itemId, itemName) => {
    if (!window.confirm(`Delete "${itemName}" permanently? This cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from('packing_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      // Remove from local state
      setItems(items.filter(item => item.id !== itemId));
      alert(`✅ Deleted "${itemName}"`);
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item from database');
    }
  };

  // Edit item name
  const startEditingName = (itemId, currentName) => {
    setEditingName(itemId);
    setEditNameText(currentName || '');
  };

  const saveName = async (itemId) => {
    if (!editNameText.trim()) {
      alert('Item name cannot be empty');
      return;
    }

    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, items_to_pack: editNameText.trim() };
        updateItemInDatabase(updatedItem);
        return updatedItem;
      }
      return item;
    });
    setItems(updatedItems);
    setEditingName(null);
    setEditNameText('');
  };

  const cancelEditName = () => {
    setEditingName(null);
    setEditNameText('');
  };

  // Edit category
  const startEditingCategory = (itemId, currentCategory) => {
    setEditingCategory(itemId);
    setEditCategoryText(currentCategory || '');
  };

  const saveCategory = async (itemId) => {
    if (!editCategoryText.trim()) {
      alert('Category cannot be empty');
      return;
    }

    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, category: editCategoryText.trim() };
        updateItemInDatabase(updatedItem);
        return updatedItem;
      }
      return item;
    });
    setItems(updatedItems);
    setEditingCategory(null);
    setEditCategoryText('');
  };

  const cancelEditCategory = () => {
    setEditingCategory(null);
    setEditCategoryText('');
  };

  // Edit notes for existing items
  const startEditingNotes = (itemId, currentNotes) => {
    setEditingNotes(itemId);
    setEditNotesText(currentNotes || '');
  };

  const saveNotes = async (itemId) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, notes: editNotesText.trim() };
        updateItemInDatabase(updatedItem);
        return updatedItem;
      }
      return item;
    });
    setItems(updatedItems);
    setEditingNotes(null);
    setEditNotesText('');
  };

  const cancelEditNotes = () => {
    setEditingNotes(null);
    setEditNotesText('');
  };

  // Add new item
  const addNewItem = async () => {
    if (!newItemName.trim()) {
      alert('Please enter an item name');
      return;
    }

    let category = newItemCategory.trim();
    if (!category) {
      category = prompt('Enter category name:');
      if (!category) {
        alert('Please enter a category');
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('packing_items')
        .insert([{
          bring_flag: 'NO',
          packed_flag: 'NO',
          items_to_pack: newItemName.trim(),
          category: category,
          notes: newItemNotes.trim()
        }])
        .select();

      if (error) throw error;

      setNewItemName('');
      setNewItemCategory('');
      setNewItemNotes('');
      await loadItemsFromDatabase();
      alert(`✅ Added "${newItemName}" to ${category}!`);
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Error adding item to database');
    }
  };

  const saveItemsToDatabase = async (itemsToSave) => {
    try {
      const formattedItems = itemsToSave.map(item => ({
        bring_flag: item.bring_flag || 'NO',
        packed_flag: item.packed_flag || 'NO',
        items_to_pack: item.items_to_pack,
        category: item.category,
        notes: item.notes || ''
      }));

      const { data, error } = await supabase
        .from('packing_items')
        .insert(formattedItems)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving to database:', error);
      alert('Error saving to database');
      return [];
    }
  };

  const toggleBring = async (itemId) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        const updatedItem = {
          ...item,
          bring_flag: item.bring_flag === 'YES' ? 'NO' : 'YES',
          packed_flag: item.bring_flag === 'YES' ? 'NO' : item.packed_flag
        };
        updateItemInDatabase(updatedItem);
        return updatedItem;
      }
      return item;
    });
    setItems(updatedItems);
  };

  const togglePacked = async (itemId) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        const updatedItem = {
          ...item,
          packed_flag: item.packed_flag === 'YES' ? 'NO' : 'YES'
        };
        updateItemInDatabase(updatedItem);
        return updatedItem;
      }
      return item;
    });
    setItems(updatedItems);
  };

  const loadSampleDataToDatabase = async () => {
    const sampleItems = [
      { bring_flag: 'NO', packed_flag: 'NO', items_to_pack: 'Laptop', category: 'Electronics', notes: 'Work laptop with charger' },
      { bring_flag: 'NO', packed_flag: 'NO', items_to_pack: 'Phone charger', category: 'Electronics', notes: 'USB-C, bring extra cable' },
      { bring_flag: 'NO', packed_flag: 'NO', items_to_pack: 'T-shirts', category: 'Clothes', notes: '3-4 pieces, pack light colors' },
      { bring_flag: 'NO', packed_flag: 'NO', items_to_pack: 'Jeans', category: 'Clothes', notes: 'Comfortable pair for walking' },
      { bring_flag: 'NO', packed_flag: 'NO', items_to_pack: 'Toothbrush', category: 'Toiletries', notes: 'Electric toothbrush + charger' },
      { bring_flag: 'NO', packed_flag: 'NO', items_to_pack: 'Toothpaste', category: 'Toiletries', notes: 'Travel size, under 3oz' },
      { bring_flag: 'NO', packed_flag: 'NO', items_to_pack: 'Passport', category: 'Documents', notes: 'Check expiry date first!' },
      { bring_flag: 'NO', packed_flag: 'NO', items_to_pack: 'Tickets', category: 'Documents', notes: 'Print backup copies' },
      { bring_flag: 'NO', packed_flag: 'NO', items_to_pack: 'Sunglasses', category: 'Accessories', notes: 'UV protection, bring case' },
      { bring_flag: 'NO', packed_flag: 'NO', items_to_pack: 'Camera', category: 'Electronics', notes: 'Don\'t forget SD card and extra batteries' }
    ];

    const savedItems = await saveItemsToDatabase(sampleItems);
    if (savedItems.length > 0) {
      await loadItemsFromDatabase();
      alert(`✅ Loaded ${savedItems.length} sample items with notes!`);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());

        const importedItems = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());

          if (values[2]) {
            importedItems.push({
              bring_flag: values[0] || 'NO',
              packed_flag: values[1] || 'NO',
              items_to_pack: values[2] || '',
              category: values[3] || 'Misc',
              notes: values[4] || ''
            });
          }
        }

        if (importedItems.length > 0) {
          const savedItems = await saveItemsToDatabase(importedItems);
          if (savedItems.length > 0) {
            await loadItemsFromDatabase();
            alert(`✅ Imported ${savedItems.length} items to database!`);
          }
        }

      } catch (error) {
        console.error('Error:', error);
        alert('Error reading CSV file');
      }
    };

    reader.readAsText(file);
    event.target.value = '';
  };

  const exportToCSV = () => {
    const csvContent = [
      'Bring?,Packed?,Items to Pack,Category,Notes',
      ...items.map(item =>
        `"${item.bring_flag}","${item.packed_flag}","${item.items_to_pack}","${item.category}","${item.notes || ''}"`
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

  const clearAllData = async () => {
    if (!window.confirm('Delete all items from database? This cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('packing_items')
        .delete()
        .neq('id', 0);

      if (error) throw error;
      setItems([]);
      alert('✅ All items deleted from database');
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting from database');
    }
  };

  // Get categories for dropdown
  const categories = [...new Set(items.map(item => item.category))].sort();

  const filteredItems = items.filter(item =>
    item.items_to_pack.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const tripItems = items.filter(item => item.bring_flag === 'YES');
  const packedItems = tripItems.filter(item => item.packed_flag === 'YES');

  const groupedItems = filteredItems.reduce((groups, item) => {
    const category = item.category || 'Other';
    if (!groups[category]) groups[category] = [];
    groups[category].push(item);
    return groups;
  }, {});

  // MODIFIED: Sort within categories so packed items go to bottom
  const groupedTripItems = tripItems.reduce((groups, item) => {
    const category = item.category || 'Other';
    if (!groups[category]) groups[category] = [];
    groups[category].push(item);
    return groups;
  }, {});

  // Sort items within each category: unpacked first, packed last
  Object.keys(groupedTripItems).forEach(category => {
    groupedTripItems[category].sort((a, b) => {
      // If one is packed and other isn't, packed goes to bottom
      if (a.packed_flag === 'YES' && b.packed_flag !== 'YES') return 1;
      if (a.packed_flag !== 'YES' && b.packed_flag === 'YES') return -1;

      // If both have same packed status, sort alphabetically
      return a.items_to_pack.localeCompare(b.items_to_pack);
    });
  });

  if (loading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{
          __html: `
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
        <div style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid rgba(255,255,255,0.3)',
              borderTop: '4px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p>Loading your packing lists...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 10px;
        }

        .app-container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .header {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
          padding: 20px;
          text-align: center;
        }

        .header h1 {
          font-size: 24px;
          margin-bottom: 10px;
        }

        .tab-buttons {
          display: flex;
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
        }

        .tab-button {
          flex: 1;
          padding: 15px;
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .tab-button.active {
          background: white;
          border-bottom: 3px solid #4facfe;
          color: #4facfe;
          font-weight: 600;
        }

        .content {
          padding: 20px;
          max-height: 70vh;
          overflow-y: auto;
        }

        .add-item-section {
          background: #e8f5e8;
          border: 1px solid #c3e6cb;
          border-radius: 10px;
          padding: 15px;
          margin-bottom: 20px;
        }

        .add-item-section h3 {
          margin-bottom: 15px;
          color: #155724;
        }

        .add-item-form {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          align-items: end;
        }

        .add-input {
          padding: 10px;
          border: 2px solid #c3e6cb;
          border-radius: 8px;
          font-size: 14px;
        }

        .add-item-form .btn {
          grid-column: span 2;
          margin-top: 10px;
        }

        .search-box {
          width: 100%;
          padding: 12px;
          margin-bottom: 20px;
          border: 2px solid #e9ecef;
          border-radius: 10px;
          font-size: 16px;
        }

        .category-section {
          margin-bottom: 25px;
        }

        .category-header {
          background: #f8f9fa;
          padding: 12px 15px;
          border-radius: 10px;
          font-weight: 600;
          color: #495057;
          margin-bottom: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .category-count {
          background: #6c757d;
          color: white;
          padding: 4px 8px;
          border-radius: 15px;
          font-size: 12px;
        }

        .item {
          display: flex;
          align-items: flex-start;
          padding: 15px;
          margin-bottom: 8px;
          background: #f8f9fa;
          border-radius: 10px;
          transition: all 0.3s;
        }

        .item:hover {
          background: #e9ecef;
        }

        .item.packed {
          opacity: 0.6;
          background: #d4edda;
        }

        .checkbox {
          width: 20px;
          height: 20px;
          margin-right: 15px;
          margin-top: 2px;
          cursor: pointer;
          flex-shrink: 0;
        }

        .item-content {
          flex: 1;
        }

        .item-name {
          font-weight: 500;
          color: #212529;
          margin-bottom: 4px;
          font-size: 16px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .item-name:hover {
          background: rgba(59, 130, 246, 0.1);
        }

        .item-category {
          font-size: 11px;
          color: #6c757d;
          background: rgba(108, 117, 125, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          display: inline-block;
          margin-bottom: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .item-category:hover {
          background: rgba(108, 117, 125, 0.2);
        }

        .item-notes {
          font-size: 13px;
          color: #6c757d;
          font-style: italic;
          line-height: 1.4;
          background: rgba(108, 117, 125, 0.1);
          padding: 8px 12px;
          border-radius: 6px;
          border-left: 3px solid #6c757d;
          cursor: pointer;
          transition: background 0.2s;
        }

        .item-notes:hover {
          background: rgba(108, 117, 125, 0.15);
        }

        .item-notes.placeholder {
          color: #adb5bd;
          font-style: normal;
        }

        .edit-input {
          width: 100%;
          padding: 6px 10px;
          border: 2px solid #4facfe;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
          font-weight: 500;
        }

        .edit-category-input {
          width: 100%;
          padding: 4px 8px;
          border: 2px solid #4facfe;
          border-radius: 4px;
          font-size: 11px;
          font-family: inherit;
        }

        .edit-notes {
          width: 100%;
          padding: 8px 12px;
          border: 2px solid #4facfe;
          border-radius: 6px;
          font-size: 13px;
          font-family: inherit;
          resize: vertical;
          min-height: 40px;
        }

        .edit-buttons {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }

        .edit-notes-buttons {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }

        .btn-save {
          background: #28a745;
          color: white;
          border: none;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        .btn-cancel {
          background: #6c757d;
          color: white;
          border: none;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        .item-actions {
          display: flex;
          gap: 8px;
          margin-left: 10px;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .remove-btn {
          background: #dc3545;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 15px;
          font-size: 12px;
          cursor: pointer;
        }

        .delete-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 6px 10px;
          border-radius: 15px;
          font-size: 11px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .delete-btn:hover {
          background: #dc3545;
        }

        .stats {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px;
          border-radius: 10px;
          margin-bottom: 20px;
          text-align: center;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 15px;
          margin-top: 10px;
        }

        .stat-item {
          text-align: center;
        }

        .stat-number {
          font-size: 24px;
          font-weight: bold;
        }

        .stat-label {
          font-size: 12px;
          opacity: 0.8;
        }

        .import-section {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 20px;
          text-align: center;
        }

        .file-input {
          margin: 10px 0;
        }

        .btn {
          background: #4facfe;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 10px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s;
          margin: 0 5px;
        }

        .btn:hover {
          background: #0056b3;
        }

        .btn-small {
          padding: 8px 16px;
          font-size: 14px;
          margin: 0 5px;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #6c757d;
        }

        .actions-bar {
          margin-bottom: 20px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .file-upload-btn {
          position: relative;
          overflow: hidden;
          display: inline-block;
        }

        .file-upload-btn input[type=file] {
          position: absolute;
          left: -9999px;
        }

        @media (max-width: 600px) {
          .add-item-form {
            grid-template-columns: 1fr;
          }

          .add-item-form .btn {
            grid-column: span 1;
          }

          .item-actions {
            flex-direction: column;
            gap: 4px;
          }
        }
      `}} />

      <div className="app-container">
        <div className="header">
          <h1>🎒 My Packing List</h1>
          <p>Never forget anything again!</p>
        </div>

        <div className="tab-buttons">
          <button
            className={`tab-button ${activeTab === 'master' ? 'active' : ''}`}
            onClick={() => setActiveTab('master')}
          >
            📋 Master List
          </button>
          <button
            className={`tab-button ${activeTab === 'trip' ? 'active' : ''}`}
            onClick={() => setActiveTab('trip')}
          >
            ✈️ Trip List
          </button>
        </div>

        <div className="content">
          {activeTab === 'master' && (
            <div>
              {items.length === 0 && (
                <div className="import-section">
                  <h3>📁 Import Your Data</h3>
                  <p>Upload your CSV file to get started</p>
                  <label className="btn file-upload-btn">
                    📤 Import CSV
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                    />
                  </label>
                  <button onClick={loadSampleDataToDatabase} className="btn">
                    Or Load Sample Data
                  </button>
                </div>
              )}

              {items.length > 0 && (
                <div>
                  {/* Add New Item Section */}
                  <div className="add-item-section">
                    <h3>➕ Add New Item</h3>
                    <div className="add-item-form">
                      <input
                        type="text"
                        placeholder="Item name"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="add-input"
                      />
                      <select
                        value={newItemCategory}
                        onChange={(e) => setNewItemCategory(e.target.value)}
                        className="add-input"
                      >
                        <option value="">Select category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="Other">+ Add New Category</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Notes (optional)"
                        value={newItemNotes}
                        onChange={(e) => setNewItemNotes(e.target.value)}
                        className="add-input"
                        style={{ gridColumn: 'span 2' }}
                      />
                      <button onClick={addNewItem} className="btn">Add Item</button>
                    </div>
                  </div>

                  <div className="actions-bar">
                    <label className="btn btn-small file-upload-btn">
                      📤 Import CSV
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                      />
                    </label>
                    <button onClick={exportToCSV} className="btn btn-small">
                      📥 Export CSV
                    </button>
                    <button onClick={loadSampleDataToDatabase} className="btn btn-small">
                      📦 Load Sample
                    </button>
                    <button onClick={clearAllData} className="btn btn-small" style={{ background: '#dc3545' }}>
                      🗑️ Clear All
                    </button>
                  </div>

                  <input
                    type="text"
                    className="search-box"
                    placeholder="🔍 Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />

                  {Object.keys(groupedItems).sort().map(category => (
                    <div key={category} className="category-section">
                      <div className="category-header">
                        {category}
                        <span className="category-count">
                          {groupedItems[category].filter(item => item.bring_flag === 'YES').length}/{groupedItems[category].length}
                        </span>
                      </div>

                      {groupedItems[category].map(item => (
                        <div key={item.id} className="item">
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={item.bring_flag === 'YES'}
                            onChange={() => toggleBring(item.id)}
                          />
                          <div className="item-content">

                            {/* Editable Item Name */}
                            {editingName === item.id ? (
                              <div>
                                <input
                                  className="edit-input"
                                  value={editNameText}
                                  onChange={(e) => setEditNameText(e.target.value)}
                                  placeholder="Item name..."
                                  autoFocus
                                />
                                <div className="edit-buttons">
                                  <button
                                    className="btn-save"
                                    onClick={() => saveName(item.id)}
                                  >
                                    Save
                                  </button>
                                  <button
                                    className="btn-cancel"
                                    onClick={cancelEditName}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className="item-name"
                                onClick={() => startEditingName(item.id, item.items_to_pack)}
                                title="Click to edit item name"
                              >
                                {item.items_to_pack}
                              </div>
                            )}

                            {/* Editable Category */}
                            {editingCategory === item.id ? (
                              <div>
                                <input
                                  className="edit-category-input"
                                  value={editCategoryText}
                                  onChange={(e) => setEditCategoryText(e.target.value)}
                                  placeholder="Category..."
                                  autoFocus
                                />
                                <div className="edit-buttons">
                                  <button
                                    className="btn-save"
                                    onClick={() => saveCategory(item.id)}
                                  >
                                    Save
                                  </button>
                                  <button
                                    className="btn-cancel"
                                    onClick={cancelEditCategory}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className="item-category"
                                onClick={() => startEditingCategory(item.id, item.category)}
                                title="Click to edit category"
                              >
                                {item.category}
                              </div>
                            )}

                            {/* Editable Notes */}
                            {editingNotes === item.id ? (
                              <div>
                                <textarea
                                  className="edit-notes"
                                  value={editNotesText}
                                  onChange={(e) => setEditNotesText(e.target.value)}
                                  placeholder="Add notes..."
                                  autoFocus
                                />
                                <div className="edit-notes-buttons">
                                  <button
                                    className="btn-save"
                                    onClick={() => saveNotes(item.id)}
                                  >
                                    Save
                                  </button>
                                  <button
                                    className="btn-cancel"
                                    onClick={cancelEditNotes}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`item-notes ${!item.notes || !item.notes.trim() ? 'placeholder' : ''}`}
                                onClick={() => startEditingNotes(item.id, item.notes)}
                                title="Click to edit notes"
                              >
                                {item.notes && item.notes.trim() ?
                                  `📝 ${item.notes}` :
                                  '📝 Click to add notes...'
                                }
                              </div>
                            )}
                          </div>

                          {/* Delete Button for Master List */}
                          <div className="item-actions">
                            <button
                              className="delete-btn"
                              onClick={() => deleteItem(item.id, item.items_to_pack)}
                              title="Delete item permanently"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'trip' && (
            <div>
              {tripItems.length > 0 && (
                <div className="stats">
                  <h3>📊 Trip Progress</h3>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <div className="stat-number">{tripItems.length}</div>
                      <div className="stat-label">To Pack</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">{packedItems.length}</div>
                      <div className="stat-label">Packed</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">
                        {tripItems.length > 0 ? Math.round((packedItems.length / tripItems.length) * 100) : 0}%
                      </div>
                      <div className="stat-label">Complete</div>
                    </div>
                  </div>
                </div>
              )}

              {tripItems.length === 0 ? (
                <div className="empty-state">
                  <div style={{ fontSize: '48px', marginBottom: '15px' }}>✈️</div>
                  <p>No items selected for this trip</p>
                  <p>Go to Master List to select items</p>
                </div>
              ) : (
                Object.keys(groupedTripItems).sort().map(category => (
                  <div key={category} className="category-section">
                    <div className="category-header">
                      {category}
                      <span className="category-count">
                        {groupedTripItems[category].filter(item => item.packed_flag === 'YES').length}/{groupedTripItems[category].length} packed
                      </span>
                    </div>

                    {groupedTripItems[category].map(item => (
                      <div key={item.id} className={`item ${item.packed_flag === 'YES' ? 'packed' : ''}`}>
                        <input
                          type="checkbox"
                          className="checkbox"
                          checked={item.packed_flag === 'YES'}
                          onChange={() => togglePacked(item.id)}
                        />
                        <div className="item-content">
                          <div className="item-name" style={{
                            textDecoration: item.packed_flag === 'YES' ? 'line-through' : 'none',
                            cursor: 'default'
                          }}>
                            {item.items_to_pack}
                          </div>

                          <div className="item-category">
                            {item.category}
                          </div>

                          {/* Notes still editable in trip tab */}
                          {editingNotes === item.id ? (
                            <div>
                              <textarea
                                className="edit-notes"
                                value={editNotesText}
                                onChange={(e) => setEditNotesText(e.target.value)}
                                placeholder="Add notes..."
                                autoFocus
                              />
                              <div className="edit-notes-buttons">
                                <button
                                  className="btn-save"
                                  onClick={() => saveNotes(item.id)}
                                >
                                  Save
                                </button>
                                <button
                                  className="btn-cancel"
                                  onClick={cancelEditNotes}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className={`item-notes ${!item.notes || !item.notes.trim() ? 'placeholder' : ''}`}
                              onClick={() => startEditingNotes(item.id, item.notes)}
                            >
                              {item.notes && item.notes.trim() ?
                                `📝 ${item.notes}` :
                                '📝 Click to add notes...'
                              }
                            </div>
                          )}
                        </div>
                        <button
                          className="remove-btn"
                          onClick={() => toggleBring(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;