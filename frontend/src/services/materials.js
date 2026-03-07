import djangoApi from './api';

export const materialsService = {

  getAll: async ({ subject = '', q = '', page = 1 } = {}) => {
    const params = new URLSearchParams();
    if (subject)  params.set('subject', subject);
    if (q)        params.set('q',       q);
    if (page > 1) params.set('page',    page);
    const res = await djangoApi.get(`/materials/?${params.toString()}`);
    return res.data;
  },

  getMine: async () => {
    const res = await djangoApi.get('/materials/mine/');
    return res.data.results;
  },

  // Upload — authenticated multipart
  upload: async ({ title, description, subject, file }, onProgress) => {
    const form = new FormData();
    form.append('title',       title);
    form.append('description', description || '');
    form.append('subject',     subject     || '');
    form.append('file',        file);
    const res = await djangoApi.post('/materials/upload/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress
        ? (e) => onProgress(e.total ? Math.round((e.loaded / e.total) * 100) : 0)
        : undefined,
    });
    return res.data;
  },

  // Increment download counter + return URL
  download: async (id) => {
    const res = await djangoApi.post(`/materials/${id}/download/`);
    return res.data.file_url;
  },

  // Extract text from stored PDF for quiz generation
  extractForQuiz: async (id) => {
    const res = await djangoApi.post(`/materials/${id}/extract/`);
    return res.data;
  },

  // Soft-delete (owner or admin)
  delete: async (id) => {
    const res = await djangoApi.delete(`/materials/${id}/delete/`);
    return res.data;
  },
};