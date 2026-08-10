import apiClient from './apiClient';

export interface SupportMessage {
  id: number;
  target_recipient: 'developer' | 'student_leader';
  category: string;
  user_email?: string;
  sender_name?: string;
  subject?: string;
  message: string;
  status: 'open' | 'resolved';
  reply_notes?: string;
  attachment_url?: string;
  attachment_name?: string;
  reg_number?: string;
  campus?: string;
  faculty?: string;
  department?: string;
  course?: string;
  year_of_study?: string;
  semester?: string;
  created_at: string;
  updated_at: string;
}

export const supportService = {
  async submitMessage(data: {
    target_recipient: 'developer' | 'student_leader';
    category: string;
    user_email?: string;
    sender_name?: string;
    subject?: string;
    message: string;
    attachment_url?: string;
    attachment_name?: string;
    reg_number?: string;
    campus?: string;
    faculty?: string;
    department?: string;
    course?: string;
    year_of_study?: string;
    semester?: string;
  }): Promise<SupportMessage> {
    const res = await apiClient.post<SupportMessage>('/support', data);
    return res.data;
  },

  async getStudentMessages(): Promise<SupportMessage[]> {
    const res = await apiClient.get<SupportMessage[]>('/support/student');
    return res.data;
  },

  async getInboxMessages(target?: string, statusFilter?: string): Promise<SupportMessage[]> {
    const params = new URLSearchParams();
    if (target) params.append('target', target);
    if (statusFilter) params.append('status_filter', statusFilter);
    const res = await apiClient.get<SupportMessage[]>(`/support?${params.toString()}`);
    return res.data;
  },

  async updateMessageStatus(id: number, statusVal: string, replyNotes?: string): Promise<SupportMessage> {
    const res = await apiClient.patch<SupportMessage>(`/support/${id}`, {
      status: statusVal,
      reply_notes: replyNotes,
    });
    return res.data;
  },

  async replyToMessage(id: number, message: string): Promise<SupportMessage> {
    const res = await apiClient.post<SupportMessage>(`/support/${id}/reply`, { message });
    return res.data;
  },
};
