import apiClient from './apiClient';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  is_admin: boolean;
  is_active: boolean;
  subscription_tier: string;
  is_subscription_active: boolean;
  subscription_expires_at: string | null;
  subscription_entitlements: {
    id: number;
    tier_id: string;
    expires_at: string;
    payment_id: number | null;
    source: string;
  }[];
  country: string | null;
  created_at: string;
  last_seen: string | null;
  most_visited_page: string | null;
  total_time_spent: number;
  is_online: boolean;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  counts: Record<string, number>;
}

export interface AdminUsersFilters {
  search?: string;
  tier?: string;
  sort_field?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface UserActivityDetail {
  user: {
    id: number;
    name: string;
    email: string;
    subscription_tier: string;
    subscription_expires_at: string | null;
    is_active: boolean;
    is_admin: boolean;
    country: string | null;
    created_at: string | null;
    last_seen: string | null;
  };
  pages: { path: string; visits: number; total_time: number }[];
  payments: {
    id: number;
    amount: number;
    currency: string;
    method: string;
    status: string;
    item_type: string;
    item_id: string | null;
    reference: string | null;
    created_at: string | null;
  }[];
  total_time_spent: number;
  total_spent: number;
}

export interface AdPost {
  id: number;
  title: string;
  image_url?: string;
  link_url?: string;
  category?: string;
  is_active: boolean;
  created_at: string;
}

export interface Campaign {
  id: number;
  slug: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  incentive_type: string;
  incentive_value: number;
  asset_video_url?: string;
  asset_image_url?: string;
  og_image_url?: string;
  banner_text?: string;
  theme_color_hex?: string;
  use_splash_screen: boolean;
  use_floating_badge: boolean;
  use_particle_effects: boolean;
  use_custom_icons: boolean;
  click_count: number;
  login_count: number;
  purchase_count: number;
  revenue_generated: number;
  is_active: boolean;
  created_at: string;
}

export interface SMSSettings {
  SMS_SRC: string;
  SMS_ENABLED: boolean;
  SMS_TEMPLATE: string;
}

export interface EmailSettings {
  SMTP_EMAIL: string;
  SMTP_PASSWORD?: string;
}

export interface SupportSettings {
  SUPPORT_EMAIL: string;
  SUPPORT_WHATSAPP: string;
  SUPPORT_WHATSAPP_NUMBER: string;
}

export const adminService = {
  // Users
  getUsers: async (filters: AdminUsersFilters = {}): Promise<AdminUsersResponse> => {
    const params: Record<string, string | number> = {};
    if (filters.search) params.search = filters.search;
    if (filters.tier) params.tier = filters.tier;
    if (filters.sort_field) params.sort_field = filters.sort_field;
    if (filters.sort_dir) params.sort_dir = filters.sort_dir;
    if (filters.page) params.page = filters.page;
    if (filters.per_page) params.per_page = filters.per_page;

    const response = await apiClient.get<AdminUsersResponse>('/admin/users', { params });
    return response.data;
  },

  getUserActivity: async (userId: number): Promise<UserActivityDetail> => {
    const response = await apiClient.get<UserActivityDetail>(`/admin/users/${userId}/activity`);
    return response.data;
  },

  revokeSubscription: async (userId: number): Promise<void> => {
    await apiClient.put(`/admin/users/${userId}/revoke`);
  },

  grantSubscription: async (userId: number, payload: { tier: string; duration_days: number }): Promise<void> => {
    await apiClient.post(`/admin/users/${userId}/grant-subscription`, payload);
  },

  toggleUserActive: async (userId: number): Promise<{ is_active: boolean }> => {
    const response = await apiClient.put(`/admin/users/${userId}/toggle-active`);
    return response.data;
  },

  broadcastPush: async (data: {
    title: string;
    body: string;
    url?: string;
    target_tier?: string;
    target_country?: string;
  }): Promise<{ message: string; targeted_users: number; total_subscriptions: number; emails_sent: number }> => {
    const response = await apiClient.post('/admin/broadcast-push', {
      title: data.title,
      body: data.body,
      url: data.url || '/',
      target_tier: data.target_tier || 'all',
      target_country: data.target_country || 'all',
    });
    return response.data;
  },

  // Ads
  getAds: async (): Promise<AdPost[]> => {
    const response = await apiClient.get<AdPost[]>('/admin/ads');
    return response.data;
  },

  createAd: async (payload: Omit<AdPost, 'id' | 'created_at'>): Promise<AdPost> => {
    const response = await apiClient.post<AdPost>('/admin/ads', payload);
    return response.data;
  },

  updateAd: async (adId: number, payload: Partial<Omit<AdPost, 'id' | 'created_at'>>): Promise<AdPost> => {
    const response = await apiClient.put<AdPost>(`/admin/ads/${adId}`, payload);
    return response.data;
  },

  deleteAd: async (adId: number): Promise<void> => {
    await apiClient.delete(`/admin/ads/${adId}`);
  },

  // Campaigns
  getCampaigns: async (): Promise<Campaign[]> => {
    const response = await apiClient.get<Campaign[]>('/campaigns');
    return response.data;
  },

  createCampaign: async (payload: Omit<Campaign, 'id' | 'created_at' | 'click_count' | 'login_count' | 'purchase_count' | 'revenue_generated'>): Promise<Campaign> => {
    const response = await apiClient.post<Campaign>('/campaigns', payload);
    return response.data;
  },

  updateCampaign: async (campaignId: number, payload: Partial<Omit<Campaign, 'id' | 'created_at' | 'click_count' | 'login_count' | 'purchase_count' | 'revenue_generated'>>): Promise<Campaign> => {
    const response = await apiClient.put<Campaign>(`/campaigns/${campaignId}`, payload);
    return response.data;
  },

  deleteCampaign: async (campaignId: number): Promise<void> => {
    await apiClient.delete(`/campaigns/${campaignId}`);
  },

  uploadCampaignAsset: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<{ url: string }>('/campaigns/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Settings
  getSmsSettings: async (): Promise<SMSSettings> => {
    const response = await apiClient.get<SMSSettings>('/admin/settings/sms');
    return response.data;
  },

  updateSmsSettings: async (payload: Partial<SMSSettings>): Promise<SMSSettings> => {
    const response = await apiClient.put<SMSSettings>('/admin/settings/sms', payload);
    return response.data;
  },

  getEmailSettings: async (): Promise<EmailSettings> => {
    const response = await apiClient.get<EmailSettings>('/admin/settings/email');
    return response.data;
  },

  updateEmailSettings: async (payload: Partial<EmailSettings>): Promise<EmailSettings> => {
    const response = await apiClient.put<EmailSettings>('/admin/settings/email', payload);
    return response.data;
  },

  getSupportSettings: async (): Promise<SupportSettings> => {
    const response = await apiClient.get<SupportSettings>('/admin/settings/support');
    return response.data;
  },

  updateSupportSettings: async (payload: Partial<SupportSettings>): Promise<SupportSettings> => {
    const response = await apiClient.put<SupportSettings>('/admin/settings/support', payload);
    return response.data;
  },
};
