import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('master');
  const [searchTerm, setSearchTerm] = useState('');

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

  // Update item in database
  const updateItemInDatabase = async (item) => {
    try {
      const { error } = await supabase
        .from('packing_items')
        .update({
          bring_flag: item.bring_flag,
          packed_flag: item.packed_flag
        })
        .eq('id', item.id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Error updating item in database');
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

  // Toggle item for bringing on trip
  const toggleBring = async (itemId) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { 
          ...item, 
          bring_flag: item.bring_flag === 'YES' ? 'NO' : 'YES',
          packed_flag: item.bring_flag === 'YES' ? 'NO' : item.packed_flag // Reset packed if removing from trip
        };
        updateItemInDatabase(updatedItem);
        return updatedItem;
      }
      return item;
    });
    setItems(updatedItems);
  };

  // Toggle packed status
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

  // Load sample data to DATABASE
  const loadSampleDataToDatabase = async () => {
    const sampleItems = [
      { bring_flag: 'NO', packed_flag: 'NO', items_to_pack: 'Airpods', category: 'Electronics', notes: 'Bring two pairs' },
      { bring_flag: 'NO', packed_flag: 'NO', items_to_pack: 'T-shirts', category: 'Clothing', notes: '3-4 pieces' },
      { bring_flag: 'NO', packed_flag: 'NO', items_to_pack: 'Laptop', category: 'Electronics', notes: 'Work laptop' },
      { bring_flag: 'NO', packed_flag: 'NO', items_to_pack: 'Toothbrush', category: 'Toiletries', notes: 'Electric' },
      { bring_flag: 'NO', packed_flag: 'NO', items_to_pack: 'Passport', category: 'Documents', notes: 'Check expiry' },
      { bring_flag: 'NO', packed_flag: 'NO', items_to_pack: 'Jeans', category: 'Clothing', notes: 'Comfortable pair' },
      { bring_flag: 'NO', packed_flag: 'NO', items_to_pack: 'Phone charger', category: 'Electronics', notes: 'USB-C' }
    ];

    const savedItems = await saveItemsToDatabase(sampleItems);
    if (savedItems.length > 0) {
      await loadItemsFromDatabase();
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

  // Filter items
  const filteredItems = items.filter(item => 
    item.items_to_pack.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.notes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Trip items (selected for trip)
  const tripItems = items.filter(item => item.bring_flag === 'YES');
  const packedItems = tripItems.filter(item => item.packed_flag === 'YES');

  // Group items by category
  const groupedItems = filteredItems.reduce((groups, item) => {
    const category = item.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {});

  const groupedTripItems = tripItems.reduce((groups, item) => {
    const category = item.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {});

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading from database...</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>🎒 PackTrack</h1>
          <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>Smart Packing Lists</p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {/* Action Bar */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <label style={{ 
            backgroundColor: '#28a745', 
            color: 'white', 
            padding: '10px 20px', 
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
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
              backgroundColor: '#17a2b8',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📥 Export CSV
          </button>

          <button 
            onClick={loadSampleDataToDatabase}
            style={{
              backgroundColor: '#ffc107',
              color: 'black',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📦 Load Sample
          </button>

          <button 
            onClick={clearAllData}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🗑️ Clear All
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', background: '#f8f9fa', borderRadius: '6px 6px 0 0', overflow: 'hidden' }}>
          <button
            onClick={() => setActiveTab('master')}
            style={{
              flex: 1,
              padding: '15px',
              border: 'none',
              background: activeTab === 'master' ? 'white' : 'transparent',
              borderBottom: activeTab === 'master' ? '3px solid #667eea' : 'none',
              color: activeTab === 'master' ? '#667eea' : '#666',
              fontWeight: activeTab === 'master' ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            📋 Master List ({items.length})
          </button>
          <button
            onClick={() => setActiveTab('trip')}
            style={{
              flex: 1,
              padding: '15px',
              border: 'none',
              background: activeTab === 'trip' ? 'white' : 'transparent',
              borderBottom: activeTab === 'trip' ? '3px solid #667eea' : 'none',
              color: activeTab === 'trip' ? '#667eea' : '#666',
              fontWeight: activeTab === 'trip' ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ✈️ Trip List ({tripItems.length})
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ background: 'white', borderRadius: '0 0 6px 6px', minHeight: '400px' }}>
          {activeTab === 'master' && (
            <div style={{ padding: '20px' }}>
              {/* Search */}
              <input
                type="text"
                placeholder="🔍 Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '20px',
                  border: '2px solid #e9ecef',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />

              {items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <p>No items yet. Import CSV or load sample data!</p>
                </div>
              ) : (
                Object.keys(groupedItems).sort().map(category => (
                  <div key={category} style={{ marginBottom: '25px' }}>
                    <div style={{
                      background: '#f8f9fa',
                      padding: '12px 15px',
                      borderRadius: '6px',
                      fontWeight: '600',
                      color: '#495057',
                      marginBottom: '10px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      {category}
                      <span style={{
                        background: '#6c757d',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        {groupedItems[category].filter(item => item.bring_flag === 'YES').length}/{groupedItems[category].length}
                      </span>
                    </div>
                    
                    {groupedItems[category].map(item => (
                      <div key={item.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '15px',
                        marginBottom: '8px',
                        background: '#f8f9fa',
                        borderRadius: '6px',
                        transition: 'all 0.3s'
                      }}>
                        <input
                          type="checkbox"
                          checked={item.bring_flag === 'YES'}
                          onChange={() => toggleBring(item.id)}
                          style={{ width: '18px', height: '18px', marginRight: '15px', cursor: 'pointer' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '500', color: '#212529', marginBottom: '4px' }}>
                            {item.items_to_pack}
                          </div>
                          {item.notes && (
                            <div style={{ fontSize: '12px', color: '#6c757d', fontStyle: 'italic' }}>
                              {item.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'trip' && (
            <div style={{ padding: '20px' }}>
              {/* Trip Stats */}
              {tripItems.length > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '20px',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  <h3 style={{ margin: '0 0 10px 0' }}>📊 Trip Progress</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '15px' }}>
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{tripItems.length}</div>
                      <div style={{ fontSize: '12px', opacity: 0.8 }}>TO PACK</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{packedItems.length}</div>
                      <div style={{ fontSize: '12px', opacity: 0.8 }}>PACKED</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                        {tripItems.length > 0 ? Math.round((packedItems.length / tripItems.length) * 100) : 0}%
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.8 }}>COMPLETE</div>
                    </div>
                  </div>
                </div>
              )}

              {tripItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <div style={{ fontSize: '48px', marginBottom: '15px' }}>✈️</div>
                  <p>No items selected for this trip</p>
                  <p>Go to Master List to select items</p>
                </div>
              ) : (
                Object.keys(groupedTripItems).sort().map(category => (
                  <div key={category} style={{ marginBottom: '25px' }}>
                    <div style={{
                      background: '#f8f9fa',
                      padding: '12px 15px',
                      borderRadius: '6px',
                      fontWeight: '600',
                      color: '#495057',
                      marginBottom: '10px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      {category}
                      <span style={{
                        background: '#6c757d',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        {groupedTripItems[category].filter(item => item.packed_flag === 'YES').length}/{groupedTripItems[category].length} packed
                      </span>
                    </div>
                    
                    {groupedTripItems[category].map(item => (
                      <div key={item.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '15px',
                        marginBottom: '8px',
                        background: item.packed_flag === 'YES' ? '#d4edda' : '#f8f9fa',
                        borderRadius: '6px',
                        opacity: item.packed_flag === 'YES' ? 0.8 : 1,
                        transition: 'all 0.3s'
                      }}>
                        <input
                          type="checkbox"
                          checked={item.packed_flag === 'YES'}
                          onChange={() => togglePacked(item.id)}
                          style={{ width: '18px', height: '18px', marginRight: '15px', cursor: 'pointer' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontWeight: '500', 
                            color: '#212529', 
                            marginBottom: '4px',
                            textDecoration: item.packed_flag === 'YES' ? 'line-through' : 'none'
                          }}>
                            {item.items_to_pack}
                          </div>
                          {item.notes && (
                            <div style={{ fontSize: '12px', color: '#6c757d', fontStyle: 'italic' }}>
                              {item.notes}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => toggleBring(item.id)}
                          style={{
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '15px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
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
    </div>
  );
}

export default App;