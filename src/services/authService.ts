import apiClient from './apiClient';
import type { UserData } from '../context/UserContext';

export interface AuthResponse {
  status: string;
}

export const authService = {
  async googleLogin(idToken: string, referred_by_code?: string): Promise<AuthResponse> {
    const payload: Record<string, string> = { id_token: idToken };
    if (referred_by_code) payload.referred_by_code = referred_by_code;
    const response = await apiClient.post<AuthResponse>('/auth/google', payload);
    return response.data;
  },

  async mockSSOLogin(email: string, name: string, role?: string, profilePicture?: string): Promise<AuthResponse> {
    const payload: Record<string, string> = { email, name };
    if (role) payload.role = role;
    if (profilePicture) payload.profile_picture = profilePicture;
    const response = await apiClient.post<AuthResponse>('/auth/mock-sso', payload);
    return response.data;
  },

  async requestPhoneOtp(phone: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/phone/request-otp', { phone });
    return response.data;
  },

  async verifyPhoneOtp(phone: string, code: string, referred_by_code?: string): Promise<AuthResponse> {
    const payload: Record<string, string> = { phone, code };
    if (referred_by_code) payload.referred_by_code = referred_by_code;
    const response = await apiClient.post<AuthResponse>('/auth/phone/verify-otp', payload);
    return response.data;
  },

  async me(): Promise<UserData> {
    const response = await apiClient.get<Record<string, unknown>>('/auth/me');
    const data = response.data;
    return {
      id: String(data.id),
      username: data.name as string,
      email: data.email as string,
      createdAt: data.created_at as string,
      is_admin: data.is_admin as boolean,
      subscription: {
        tier: (data.subscription_tier as string) || 'free',
        expiresAt: (data.subscription_expires_at as string) || '',
      },
      subscription_entitlements: (data.subscription_entitlements as Array<Record<string, unknown>>) || [],
      favorite_teams: (data.favorite_teams as string[]) || [],
      profile_picture: data.profile_picture as string | undefined,
      referral_code: data.referral_code as string | undefined,
      referrals_count: (data.referrals_count as number) || 0,
      referral_points: (data.referral_points as number) || 0,
      unlocked_tip_ids: (data.unlocked_tip_ids as number[]) || [],
    };
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore if already logged out
    }
    window.dispatchEvent(new Event('auth:unauthorized'));
  },
};
