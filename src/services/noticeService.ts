import apiClient from './apiClient';

export interface Notice {
  id: number;
  title: string;
  category: string;
  content: string;
  priority: 'urgent' | 'high' | 'normal';
  target_faculty: string;
  posted_by: string;
  is_pinned: boolean;
  created_at?: string;
}

export const noticeService = {
  async getNotices(category?: string, faculty?: string): Promise<Notice[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (faculty) params.append('faculty', faculty);
    const res = await apiClient.get<Notice[]>(`/notices?${params.toString()}`);
    return res.data;
  },

  async createNotice(data: {
    title: string;
    category?: string;
    content: string;
    priority?: string;
    target_faculty?: string;
    is_pinned?: boolean;
  }): Promise<Notice> {
    const res = await apiClient.post<Notice>('/notices', data);
    return res.data;
  },

  async deleteNotice(id: number): Promise<void> {
    await apiClient.delete(`/notices/${id}`);
  },
};
