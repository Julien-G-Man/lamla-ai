import djangoApi from './api';

export const dashboardService = {
  // User stats
  getStats: async () => {
    const res = await djangoApi.get('/dashboard/stats/');
    return res.data;
  },

  // History
  getQuizHistory: async () => {
    const res = await djangoApi.get('/quiz/history/');
    return res.data.history;
  },

  getFlashcardHistory: async () => {
    const res = await djangoApi.get('/flashcards/history/');
    return res.data.history;
  },

  getChatHistory: async () => {
    const res = await djangoApi.get('/chatbot/history/');
    return res.data.history;
  },

  // Admin
  getAdminStats: async () => {
    const res = await djangoApi.get('/dashboard/admin/stats/');
    return res.data;
  },
  
  getAdminUsageTrends: async (days = 14) => {
    const res = await djangoApi.get(`/dashboard/admin/usage-trends/?days=${days}`);
    return res.data;
  },

  getAdminActivity: async ({ period = 'day', limit = 50, offset = 0, customDays } = {}) => {
    const params = new URLSearchParams();
    params.set('period', period);
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    if (customDays != null) params.set('custom_days', String(customDays));

    const res = await djangoApi.get(`/dashboard/admin/activity/?${params.toString()}`);
    return res.data;
  },

  getAdminUsers: async () => {
    const res = await djangoApi.get('/dashboard/admin/users/');
    return res.data.users;
  },

  getAdminUserDetails: async (userId) => {
    const res = await djangoApi.get(`/dashboard/admin/users/${userId}/`);
    return res.data;
  },

  removeUser: async (userId) => {
    const res = await djangoApi.delete(`/dashboard/admin/users/${userId}/`);
    return res.data;
  },

  // System Settings
  getSystemSettings: async () => {
    const res = await djangoApi.get('/dashboard/admin/settings/');
    return res.data;
  },

  updateSystemSettings: async (settingsData) => {
    const res = await djangoApi.put('/dashboard/admin/settings/', settingsData);
    return res.data;
  },
};
