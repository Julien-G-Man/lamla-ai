import djangoApi from './api';

export const materialsService = {
  getAll: async ({ subject = '', q = '', page = 1 }: { subject?: string; q?: string; page?: number } = {}) => {
    const params = new URLSearchParams();
    if (subject) params.set('subject', subject);
    if (q) params.set('q', q);
    if (page > 1) params.set('page', String(page));
    const res = await djangoApi.get(`/materials/?${params.toString()}`);
    return res.data;
  },

  getMine: async () => {
    const res = await djangoApi.get('/materials/mine/');
    return res.data.results;
  },

  upload: async (
    { title, description, subject, file }: { title: string; description?: string; subject?: string; file: File },
    onProgress?: (pct: number) => void
  ) => {
    const form = new FormData();
    form.append('title', title);
    form.append('description', description || '');
    form.append('subject', subject || '');
    form.append('file', file);
    const res = await djangoApi.post('/materials/upload/', form, {
      timeout: 0, // no timeout — large files + server processing can be slow
      onUploadProgress: onProgress
        ? (e) => onProgress(e.total ? Math.round((e.loaded / e.total) * 100) : 0)
        : undefined,
    });
    return res.data;
  },

  download: async (id: string | number) => {
    const res = await djangoApi.post(`/materials/${id}/download/`);
    return res.data.file_url;
  },

  extractForQuiz: async (id: string | number) => {
    const res = await djangoApi.post(`/materials/${id}/extract/`);
    return res.data;
  },

  delete: async (id: string | number) => {
    const res = await djangoApi.delete(`/materials/${id}/delete/`);
    return res.data;
  },
};
