import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Auth from './Auth';
import './App.css';

// Database helper functions - just like your customer data manager
const dbHelpers = {
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

  async bulkInsertPackingItems(items) {
    try {
      const formattedItems = items.map(item => ({
        id_flag: item.ID || 'Yes',
        bring_flag: item['Bring?'] || 'NO',
        packed_flag: item['Packed?'] || 'NO',
        items_to_pack: item['Items to Pack'],
        category: item.Category || 'Misc',
        notes: item.Notes || ''
      }));

      const { data, error } = await supabase
        .from('packing_items')
        .insert(formattedItems)
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error bulk inserting:', error);
      alert('Error importing to database');
      return [];
    }
  }
};

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [packingItems, setPackingItems] = useState([]);

  // Authentication - same as your customer data manager
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
            alert(`✅ Imported ${imported.length} items to database!`);
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

  // CSV Export
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

  // Statistics
  const stats = {
    total: packingItems.length,
    bring: packingItems.filter(item => item.bring_flag === 'YES').length,
    packed: packingItems.filter(item => item.packed_flag === 'YES').length
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
            <p>Smart Packing Lists with Database Storage</p>
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
        </div>
      )}

      {/* Main Content */}
      <div className="main-content">
        {/* Action Bar */}
        <div className="action-bar">
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
          <button onClick={loadAllData} className="btn-secondary">
            🔄 Refresh
          </button>
        </div>

        {/* Results */}
        <div className="results-container">
          {packingItems.length === 0 ? (
            <div className="no-results">
              <p>No items found. Import your CSV file to get started!</p>
            </div>
          ) : (
            packingItems.map(item => (
              <div key={item.id} className="result-card">
                <div className="result-header">
                  <div className="result-header-left">
                    <div>
                      <h3 className="result-title">{item.items_to_pack}</h3>
                      <div className="result-meta">
                        {item.category} • ID: {item.id_flag || 'Empty'}
                      </div>
                    </div>
                  </div>
                  <div className="result-header-right">
                    <span className={`badge ${item.bring_flag === 'YES' ? 'bring-yes' : 'bring-no'}`}>
                      Bring: {item.bring_flag}
                    </span>
                    <span className={`badge ${item.packed_flag === 'YES' ? 'packed-yes' : 'packed-no'}`}>
                      Packed: {item.packed_flag}
                    </span>
                  </div>
                </div>
                {item.notes && (
                  <p className="result-summary">{item.notes}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default App;