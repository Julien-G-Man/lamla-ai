import djangoApi from './api';

export const dashboardService = {
  getStats: async () => {
    const res = await djangoApi.get('/dashboard/stats/');
    return res.data;
  },

  getQuizFeedbackSummary: async (source = 'quiz_results') => {
    const res = await djangoApi.get(`/dashboard/quiz-feedback/?source=${encodeURIComponent(source)}`);
    return res.data;
  },

  submitQuizFeedback: async ({ rating, source = 'quiz_results' }: { rating: number; source?: string }) => {
    const res = await djangoApi.post('/dashboard/quiz-feedback/', { rating, source });
    return res.data;
  },

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

  getAdminStats: async () => {
    const res = await djangoApi.get('/dashboard/admin/stats/');
    return res.data;
  },

  getAdminQuizFeedback: async (limit = 100) => {
    const res = await djangoApi.get(`/dashboard/admin/quiz-feedback/?limit=${limit}`);
    return res.data;
  },

  getAdminUsageTrends: async (days = 14) => {
    const res = await djangoApi.get(`/dashboard/admin/usage-trends/?days=${days}`);
    return res.data;
  },

  getAdminActivity: async ({
    period = 'day',
    limit = 50,
    offset = 0,
    customDays,
  }: { period?: string; limit?: number; offset?: number; customDays?: number } = {}) => {
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

  getAdminUserDetails: async (userId: string | number) => {
    const res = await djangoApi.get(`/dashboard/admin/users/${userId}/`);
    return res.data;
  },

  removeUser: async (userId: string | number) => {
    const res = await djangoApi.delete(`/dashboard/admin/users/${userId}/`);
    return res.data;
  },

  getSystemSettings: async () => {
    const res = await djangoApi.get('/dashboard/admin/settings/');
    return res.data;
  },

  updateSystemSettings: async (settingsData: Record<string, unknown>) => {
    const res = await djangoApi.put('/dashboard/admin/settings/', settingsData);
    return res.data;
  },
};
