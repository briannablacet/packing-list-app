import React, { useState } from 'react';

function App() {
  const [items, setItems] = useState([]);

  // Handle CSV file upload - SKIPPING the ID column
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
          
          // NEW FORMAT (no ID column): Bring?,Packed?,Items to Pack,Category,Notes
          if (values[2]) { // Check if "Items to Pack" exists (now at index 2)
            importedItems.push({
              id: Date.now() + i, // Simple ID for React
              bring_flag: values[0] || 'NO',     // Bring?
              packed_flag: values[1] || 'NO',    // Packed?
              items_to_pack: values[2] || '',    // Items to Pack
              category: values[3] || 'Misc',     // Category
              notes: values[4] || ''             // Notes
            });
          }
        }
        
        setItems(importedItems);
        alert(`✅ Imported ${importedItems.length} items!`);
        
      } catch (error) {
        alert('Error reading CSV file');
      }
    };
    
    reader.readAsText(file);
  };

  // Export to CSV - NEW FORMAT (no ID column)
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

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎒 PackTrack</h1>
      <p style={{ color: '#666', fontSize: '14px' }}>
        Format: Bring?,Packed?,Items to Pack,Category,Notes (ID column removed)
      </p>
      
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
          style={{
            backgroundColor: '#008CBA',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          📥 Export CSV
        </button>
      </div>

      <div>
        <h3>Items ({items.length})</h3>
        
        {items.length === 0 ? (
          <div>
            <p>No items yet. Import your CSV file to get started!</p>
            <p style={{ fontSize: '12px', color: '#666' }}>
              Expected format: Bring?,Packed?,Items to Pack,Category,Notes
            </p>
          </div>
        ) : (
          <div>
            {items.map(item => (
              <div key={item.id} style={{
                border: '1px solid #ddd',
                padding: '10px',
                margin: '5px 0',
                borderRadius: '4px',
                backgroundColor: '#f9f9f9'
              }}>
                <strong>{item.items_to_pack}</strong> 
                <span style={{ marginLeft: '10px', color: '#666' }}>({item.category})</span>
                <br />
                <small>
                  Bring: {item.bring_flag} | 
                  Packed: {item.packed_flag}
                  {item.notes && ` | Notes: ${item.notes}`}
                </small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;