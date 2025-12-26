import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load data from database on startup
  useEffect(() => {
    loadItemsFromDatabase();
  }, []);

  // Load items from Supabase
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

  // Load sample data to DATABASE
  const loadSampleDataToDatabase = async () => {
    const sampleItems = [
      {
        bring_flag: 'YES',
        packed_flag: 'NO',
        items_to_pack: 'Airpods',
        category: 'Electronics',
        notes: 'Bring two pairs'
      },
      {
        bring_flag: 'YES',
        packed_flag: 'YES',
        items_to_pack: 'T-shirts',
        category: 'Clothing',
        notes: '3-4 pieces'
      },
      {
        bring_flag: 'NO',
        packed_flag: 'NO',
        items_to_pack: 'Laptop',
        category: 'Electronics',
        notes: 'Work laptop'
      },
      {
        bring_flag: 'YES',
        packed_flag: 'NO',
        items_to_pack: 'Toothbrush',
        category: 'Toiletries',
        notes: 'Electric'
      },
      {
        bring_flag: 'YES',
        packed_flag: 'YES',
        items_to_pack: 'Passport',
        category: 'Documents',
        notes: 'Check expiry date'
      }
    ];

    const savedItems = await saveItemsToDatabase(sampleItems);
    if (savedItems.length > 0) {
      await loadItemsFromDatabase(); // Refresh from database
      alert(`✅ Loaded ${savedItems.length} sample items to database!`);
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

  // Clear all data from database
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
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '20px',
        padding: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>🎒 PackTrack</h1>
        <p style={{ margin: '5px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
          Database Storage • Format: Bring?,Packed?,Items to Pack,Category,Notes
        </p>
      </div>
      
      {/* Actions */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <label style={{ 
          backgroundColor: '#28a745', 
          color: 'white', 
          padding: '12px 20px', 
          borderRadius: '8px',
          cursor: 'pointer',
          border: 'none',
          fontSize: '14px',
          fontWeight: '500'
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
            backgroundColor: items.length === 0 ? '#ccc' : '#17a2b8',
            color: 'white',
            padding: '12px 20px',
            border: 'none',
            borderRadius: '8px',
            cursor: items.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          📥 Export CSV ({items.length} items)
        </button>

        <button 
          onClick={loadSampleDataToDatabase}
          style={{
            backgroundColor: '#ffc107',
            color: 'black',
            padding: '12px 20px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          📦 Load Sample Data
        </button>

        <button 
          onClick={loadItemsFromDatabase}
          style={{
            backgroundColor: '#6f42c1',
            color: 'white',
            padding: '12px 20px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          🔄 Refresh
        </button>

        <button 
          onClick={clearAllData}
          disabled={items.length === 0}
          style={{
            backgroundColor: items.length === 0 ? '#ccc' : '#dc3545',
            color: 'white',
            padding: '12px 20px',
            border: 'none',
            borderRadius: '8px',
            cursor: items.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          🗑️ Clear All Database
        </button>
      </div>

      {/* Stats */}
      {items.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '15px',
          marginBottom: '25px',
          padding: '20px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>{items.length}</div>
            <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Total</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>{items.filter(i => i.bring_flag === 'YES').length}</div>
            <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>To Bring</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>{items.filter(i => i.packed_flag === 'YES').length}</div>
            <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Packed</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#17a2b8' }}>
              {items.filter(i => i.bring_flag === 'YES').length > 0 
                ? Math.round((items.filter(i => i.packed_flag === 'YES').length / items.filter(i => i.bring_flag === 'YES').length) * 100)
                : 0}%
            </div>
            <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Complete</div>
          </div>
        </div>
      )}

      {/* Items List */}
      <div>
        <h3 style={{ marginBottom: '15px', color: '#333' }}>
          Items from Database ({items.length})
        </h3>
        
        {items.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px', 
            color: '#666',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <p style={{ fontSize: '18px', marginBottom: '10px' }}>No items in database yet</p>
            <p>Click "📦 Load Sample Data" to see the interface, or import your CSV file!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {items.map(item => (
              <div key={item.id} style={{
                background: 'white',
                border: '1px solid #e9ecef',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s',
                borderLeft: `4px solid ${item.packed_flag === 'YES' ? '#28a745' : item.bring_flag === 'YES' ? '#ffc107' : '#dc3545'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '18px', color: '#333' }}>{item.items_to_pack}</h4>
                    <span style={{ 
                      fontSize: '14px', 
                      color: '#666',
                      backgroundColor: '#f8f9fa',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      marginTop: '5px',
                      display: 'inline-block'
                    }}>
                      {item.category}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      background: item.bring_flag === 'YES' ? '#28a745' : '#dc3545',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      Bring: {item.bring_flag}
                    </span>
                    <span style={{
                      background: item.packed_flag === 'YES' ? '#28a745' : '#ffc107',
                      color: item.packed_flag === 'YES' ? 'white' : 'black',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      Packed: {item.packed_flag}
                    </span>
                  </div>
                </div>
                {item.notes && (
                  <div style={{ 
                    marginTop: '12px', 
                    fontStyle: 'italic', 
                    color: '#666', 
                    fontSize: '14px',
                    backgroundColor: '#f8f9fa',
                    padding: '8px 12px',
                    borderRadius: '6px'
                  }}>
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