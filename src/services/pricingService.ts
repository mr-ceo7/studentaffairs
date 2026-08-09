import apiClient from './apiClient';
import { toast } from 'sonner';

export interface SubscriptionTier {
  tier_id: string;
  name: string;
  description: string;
  price_2wk: number;
  price_4wk: number;
  categories: string[];
  popular: boolean;
  currency: string;
  currency_symbol: string;
}

export async function getPricingTiers(): Promise<SubscriptionTier[]> {
  try {
    const res = await apiClient.get('/subscriptions/tiers');
    return res.data;
  } catch {
    return [];
  }
}

export async function updatePricingTier(tierId: string, updates: Partial<SubscriptionTier>): Promise<SubscriptionTier | null> {
  try {
    const response = await apiClient.put(`/subscriptions/tiers/${tierId}`, updates);
    return response.data;
  } catch (error) {
    console.error('Failed to update tier', error);
    toast.error('Failed to update pricing tier');
    return null;
  }
}

export async function addPricingTier(tierData: Partial<SubscriptionTier>): Promise<SubscriptionTier | null> {
  try {
    const response = await apiClient.post('/subscriptions/tiers', tierData);
    return response.data;
  } catch (error) {
    console.error('Failed to add tier', error);
    toast.error('Failed to create new tier');
    return null;
  }
}

export async function deletePricingTier(tierId: string): Promise<boolean> {
  try {
    await apiClient.delete(`/subscriptions/tiers/${tierId}`);
    return true;
  } catch (error) {
    console.error('Failed to delete tier', error);
    toast.error('Failed to delete tier');
    return false;
  }
}
