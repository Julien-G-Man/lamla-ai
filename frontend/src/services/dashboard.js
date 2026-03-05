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

  getAdminUsers: async () => {
    const res = await djangoApi.get('/dashboard/admin/users/');
    return res.data.users;
  },

  removeUser: async (userId) => {
    const res = await djangoApi.delete(`/dashboard/admin/users/${userId}/`);
    return res.data;
  },
};
