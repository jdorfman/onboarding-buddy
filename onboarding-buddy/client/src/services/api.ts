import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

export const questionAPI = {
  ask: (question: string, sessionId: string) => 
    api.post('/questions/ask', { question, sessionId }),
  search: (query: string) => 
    api.get(`/questions/search?q=${encodeURIComponent(query)}`),
  provideFeedback: (conversationId: number, helpful: boolean, comment?: string) =>
    api.post('/questions/feedback', { conversationId, helpful, comment })
};

export const guidesAPI = {
  getAll: () => api.get('/guides'),
  getById: (id: number) => api.get(`/guides/${id}`),
  generate: (topic: string) => api.post('/guides/generate', { topic })
};

export const architectureAPI = {
  getAll: () => api.get('/architecture'),
  getComponent: (name: string) => api.get(`/architecture/${name}`),
  explain: (component: string) => api.post('/architecture/explain', { component })
};
