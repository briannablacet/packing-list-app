import React, { useState, useEffect } from 'react';

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load sample data on startup to show the UI
  useEffect(() => {
    loadSampleData();
  }, []);

  const loadSampleData = () => {
    const sampleItems = [
      {
        id: 1,
        bring_flag: 'YES',
        packed_flag: 'NO',
        items_to_pack: 'Airpods',
        category: 'Electronics',
        notes: 'Bring two pairs'
      },
      {
        id: 2,
        bring_flag: 'YES',
        packed_flag: 'YES',
        items_to_pack: 'T-shirts',
        category: 'Clothing',
        notes: '3-4 pieces'
      },
      {
        id: 3,
        bring_flag: 'NO',
        packed_flag: 'NO',
        items_to_pack: 'Laptop',
        category: 'Electronics',
        notes: 'Work laptop'
      },
      {
        id: 4,
        bring_flag: 'YES',
        packed_flag: 'NO',
        items_to_pack: 'Toothbrush',
        category: 'Toiletries',
        notes: 'Electric'
      }
    ];
    setItems(sampleItems);
  };

  // Handle CSV file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
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
              id: Date.now() + i,
              bring_flag: values[0] || 'NO',     // Bring?
              packed_flag: values[1] || 'NO',    // Packed?
              items_to_pack: values[2] || '',    // Items to Pack
              category: values[3] || 'Misc',     // Category
              notes: values[4] || ''             // Notes
            });
          }
        }
        
        if (importedItems.length > 0) {
          // Replace current items with imported ones
          setItems(importedItems);
          alert(`✅ Imported ${importedItems.length} items!`);
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
  const clearAllData = () => {
    if (!confirm('Clear all items? This will reset to empty.')) return;
    setItems([]);
    alert('✅ All items cleared');
  };

  // Reset to sample data
  const resetSampleData = () => {
    loadSampleData();
    alert('✅ Sample data loaded');
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading...</p>
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
          CSV Format: Bring?,Packed?,Items to Pack,Category,Notes • Currently showing sample data
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
          onClick={resetSampleData}
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
          🔄 Reset Sample Data
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
          🗑️ Clear All
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
          Your Items ({items.length})
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
            <p style={{ fontSize: '18px', marginBottom: '10px' }}>No items yet</p>
            <p>Import your CSV file or load sample data to get started!</p>
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