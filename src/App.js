import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load data from database on startup
  useEffect(() => {
    loadItemsFromDatabase();
  }, []);

  // Load items from Supabase (no authentication required)
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

  // Save items to database
  const saveItemsToDatabase = async (itemsToSave) => {
    try {
      const formattedItems = itemsToSave.map(item => ({
        bring_flag: item.bring_flag,
        packed_flag: item.packed_flag,
        items_to_pack: item.items_to_pack,
        category: item.category,
        notes: item.notes
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

  // Handle CSV file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        // Skip header line, process data lines
        const importedItems = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
          
          // Format: Bring?,Packed?,Items to Pack,Category,Notes
          if (values[2]) { // Check if "Items to Pack" exists
            importedItems.push({
              bring_flag: values[0] || 'NO',     // Bring?
              packed_flag: values[1] || 'NO',    // Packed?
              items_to_pack: values[2] || '',    // Items to Pack
              category: values[3] || 'Misc',     // Category
              notes: values[4] || ''             // Notes
            });
          }
        }
        
        if (importedItems.length > 0) {
          // Save to database
          const savedItems = await saveItemsToDatabase(importedItems);
          if (savedItems.length > 0) {
            // Refresh from database
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

  // Export to CSV
  const exportToCSV = () => {
    const csvContent = [
      'Bring?,Packed?,Items to Pack,Category,Notes',
      ...items.map(item => 
        `"${item.bring_flag}","${item.packed_flag}","${item.items_to_pack}","${item.category}","${item.notes}"`
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

  // Clear all data
  const clearAllData = async () => {
    if (!confirm('Delete all items from database? This cannot be undone.')) return;
    
    try {
      const { error } = await supabase
        .from('packing_items')
        .delete()
        .neq('id', 0); // Delete all rows
      
      if (error) throw error;
      setItems([]);
      alert('✅ All items deleted from database');
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting from database');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading from database...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '20px',
        padding: '15px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '8px'
      }}>
        <h1 style={{ margin: 0 }}>🎒 PackTrack</h1>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
          Database Storage • Format: Bring?,Packed?,Items to Pack,Category,Notes
        </p>
      </div>
      
      {/* Actions */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          backgroundColor: '#4CAF50', 
          color: 'white', 
          padding: '10px 20px', 
          borderRadius: '4px',
          cursor: 'pointer',
          marginRight: '10px'
        }}>
          📤 Import CSV
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>
        
        <button 
          onClick={exportToCSV}
          disabled={items.length === 0}
          style={{
            backgroundColor: items.length === 0 ? '#ccc' : '#008CBA',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: items.length === 0 ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          📥 Export CSV ({items.length} items)
        </button>

        <button 
          onClick={loadItemsFromDatabase}
          style={{
            backgroundColor: '#ff9800',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          🔄 Refresh
        </button>

        <button 
          onClick={clearAllData}
          disabled={items.length === 0}
          style={{
            backgroundColor: items.length === 0 ? '#ccc' : '#f44336',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: items.length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          🗑️ Clear All
        </button>
      </div>

      {/* Stats */}
      {items.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '20px',
          marginBottom: '20px',
          padding: '15px',
          background: '#f5f5f5',
          borderRadius: '8px'
        }}>
          <div><strong>Total:</strong> {items.length}</div>
          <div><strong>To Bring:</strong> {items.filter(i => i.bring_flag === 'YES').length}</div>
          <div><strong>Packed:</strong> {items.filter(i => i.packed_flag === 'YES').length}</div>
        </div>
      )}

      {/* Items List */}
      <div>
        <h3>Items from Database ({items.length})</h3>
        
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p>No items in database yet.</p>
            <p>Import your CSV file to get started!</p>
          </div>
        ) : (
          <div>
            {items.map(item => (
              <div key={item.id} style={{
                border: '1px solid #ddd',
                padding: '15px',
                margin: '10px 0',
                borderRadius: '8px',
                backgroundColor: item.packed_flag === 'YES' ? '#e8f5e8' : '#fff'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '16px' }}>{item.items_to_pack}</strong> 
                    <span style={{ marginLeft: '10px', color: '#666', fontSize: '14px' }}>({item.category})</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{
                      background: item.bring_flag === 'YES' ? '#4CAF50' : '#f44336',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      Bring: {item.bring_flag}
                    </span>
                    <span style={{
                      background: item.packed_flag === 'YES' ? '#4CAF50' : '#ff9800',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      Packed: {item.packed_flag}
                    </span>
                  </div>
                </div>
                {item.notes && (
                  <div style={{ marginTop: '8px', fontStyle: 'italic', color: '#666', fontSize: '14px' }}>
                    📝 {item.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;