// Development configuration for fake user testing
export const DEV_CONFIG = {
  // Set to true to enable fake user mode
  USE_FAKE_USER: import.meta.env.VITE_USE_FAKE_USER === 'true',
  
  // Fake user ID (must match backend)
  FAKE_USER_ID: import.meta.env.VITE_FAKE_USER_ID || '507f1f77bcf86cd799439011',
  
  // API base URL
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
};

// Fake user data for development
export const FAKE_USER = {
  id: DEV_CONFIG.FAKE_USER_ID,
  name: 'Test User',
  email: 'test@example.com',
  role: 'user'
};
