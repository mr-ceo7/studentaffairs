import apiClient from "./apiClient";

export interface CommentData {
  id: number;
  ticket_id: number;
  author_name: string;
  author_role: 'student' | 'lecturer' | 'admin';
  message: string;
  proof_attachment?: string;
  created_at: string;
}

export interface TicketData {
  id: number;
  ticket_id: string;
  reg_number: string;
  faculty: string;
  department: string;
  unit_code: string;
  assessment_category: string;
  claimed_score?: number;
  verified_score?: number;
  status: string;
  proof_attachment?: string;
  additional_notes?: string;
  student_id: number;
  student_name?: string;
  lecturer_id?: number;
  created_at: string;
  updated_at: string;
  comments: CommentData[];
}

export interface TicketCreatePayload {
  reg_number: string;
  faculty: string;
  department: string;
  unit_code: string;
  assessment_category: string;
  claimed_score?: number;
  proof_attachment?: string;
  additional_notes?: string;
}

export const ticketService = {
  async createTicket(payload: TicketCreatePayload): Promise<TicketData> {
    const response = await apiClient.post<TicketData>('/tickets', payload);
    return response.data;
  },

  async listTickets(params?: { faculty?: string; status?: string }): Promise<TicketData[]> {
    const response = await apiClient.get<TicketData[]>('/tickets', { params });
    return response.data;
  },

  async getTicket(ticketId: string): Promise<TicketData> {
    const response = await apiClient.get<TicketData>(`/tickets/${ticketId}`);
    return response.data;
  },

  async updateTicketStatus(
    ticketId: string,
    status: string,
    verifiedScore?: number,
    comment?: string
  ): Promise<TicketData> {
    const payload: Record<string, unknown> = { status };
    if (verifiedScore !== undefined) payload.verified_score = verifiedScore;
    if (comment !== undefined) payload.comment = comment;
    const response = await apiClient.post<TicketData>(`/tickets/${ticketId}/status`, payload);
    return response.data;
  },

  async addComment(ticketId: string, message: string, proofAttachment?: string): Promise<CommentData> {
    const payload: Record<string, string> = { message };
    if (proofAttachment) payload.proof_attachment = proofAttachment;
    const response = await apiClient.post<CommentData>(`/tickets/${ticketId}/comments`, payload);
    return response.data;
  },

  async uploadFiles(files: FileList | File[]): Promise<{ url: string; name: string }[]> {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    const response = await apiClient.post<{ urls: string[]; files: { url: string; name: string }[] }>('/tickets/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.files;
  },
};
