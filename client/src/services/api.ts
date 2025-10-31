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
    api.post('/questions/feedback', { conversationId, helpful, comment }),
  getAllChats: () => 
    api.get('/questions/chats'),
  getChat: (chatId: string) => 
    api.get(`/questions/chats/${chatId}`)
};

export const guidesAPI = {
  getAll: () => api.get('/guides'),
  getById: (id: number) => api.get(`/guides/${id}`),
  generate: (topic: string) => api.post('/guides/generate', { topic })
};

export const quizAPI = {
  getAll: () => api.get('/quizzes'),
  getById: (id: string) => api.get(`/quizzes/${id}`),
  generate: (chatId: string, questionCount?: number, title?: string) => 
    api.post('/quizzes/generate', { chatId, questionCount, title }),
  grade: (id: string, answers: { questionId: string; selected: boolean }[]) =>
    api.post(`/quizzes/${id}/grade`, { answers }),
  delete: (id: string) => api.delete(`/quizzes/${id}`)
};
