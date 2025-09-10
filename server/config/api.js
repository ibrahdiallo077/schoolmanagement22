// Configuration API dans votre frontend (ex: src/config/api.js)

const API_BASE_URL = 'http://localhost:3001/api';

// Configuration axios ou fetch
const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Test de connectivité API
export const testApiConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/test`);
    const data = await response.json();
    console.log('✅ API connectée:', data);
    return data;
  } catch (error) {
    console.error('❌ Erreur API:', error);
    throw error;
  }
};

// Fonction de connexion
export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erreur de connexion');
    }

    return data;
  } catch (error) {
    console.error('❌ Erreur login:', error);
    throw error;
  }
};