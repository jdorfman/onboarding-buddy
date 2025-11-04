import { api } from '../api/http';

export const questionAPI = {
  ask: (question: string, sessionId: string) =>
    api.post('/api/questions/ask', { question, sessionId }),
  search: (query: string) =>
    api.get(`/api/questions/search?q=${encodeURIComponent(query)}`),
  provideFeedback: (conversationId: number, helpful: boolean, comment?: string) =>
    api.post('/api/questions/feedback', { conversationId, helpful, comment }),
  getAllChats: () =>
    api.get('/api/questions/chats'),
  getChat: (chatId: string) =>
    api.get(`/api/questions/chats/${chatId}`)
};

export const guidesAPI = {
  getAll: () => api.get('/api/guides'),
  getById: (id: number) => api.get(`/api/guides/${id}`),
  generate: (topic: string) => api.post('/api/guides/generate', { topic })
};

export const quizAPI = {
  getAll: () => api.get('/api/quizzes'),
  getById: (id: string) => api.get(`/api/quizzes/${id}`),
  generate: (chatId: string, questionCount?: number, title?: string) =>
    api.post('/api/quizzes/generate', { chatId, questionCount, title }),
  grade: (id: string, answers: { questionId: string; selected: boolean }[]) =>
    api.post(`/api/quizzes/${id}/grade`, { answers }),
  delete: (id: string) => api.delete(`/api/quizzes/${id}`)
};
