const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;

    try {
      const errorData = await response.json();
      if (errorData?.error) {
        errorMessage = errorData.error;
      }
    } catch (error) {
      // Ignore JSON parse failures and use the fallback message.
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const itemsApi = {
  getItems() {
    return apiRequest('/items');
  },

  createItem(item) {
    return apiRequest('/items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  bulkCreateItems(items) {
    return apiRequest('/items/bulk', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  },

  updateItem(id, updates) {
    return apiRequest(`/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  deleteItem(id) {
    return apiRequest(`/items/${id}`, {
      method: 'DELETE',
    });
  },

  clearItems() {
    return apiRequest('/items', {
      method: 'DELETE',
    });
  },
};
