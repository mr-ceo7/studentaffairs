import apiClient from './apiClient';

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

export interface PaymentResponse {
  id: number;
  amount: number;
  currency: string;
  method: string;
  status: string;
  reference: string;
  item_type: string;
  item_id: string;
  created_at: string;
  auth_url?: string;
  access_code?: string;
}

export async function getSubscriptionTiers(): Promise<SubscriptionTier[]> {
  try {
    const res = await apiClient.get('/subscriptions/tiers');
    return res.data;
  } catch {
    return [];
  }
}

export async function payMpesa(phone: string, tierId: string, weeks: number): Promise<PaymentResponse> {
  const res = await apiClient.post('/pay/mpesa', {
    item_type: 'subscription',
    item_id: tierId,
    duration_weeks: weeks,
    phone,
  });
  return res.data;
}

export async function payPaystack(tierId: string, weeks: number): Promise<PaymentResponse> {
  const res = await apiClient.post('/pay/paystack', {
    item_type: 'subscription',
    item_id: tierId,
    duration_weeks: weeks,
  });
  return res.data;
}

export async function payPaypal(tierId: string, weeks: number): Promise<PaymentResponse> {
  const res = await apiClient.post('/pay/paypal', {
    item_type: 'subscription',
    item_id: tierId,
    duration_weeks: weeks,
  });
  return res.data;
}

export async function getPaymentStatus(paymentId: number): Promise<PaymentResponse> {
  const res = await apiClient.get(`/pay/status/${paymentId}`);
  return res.data;
}
