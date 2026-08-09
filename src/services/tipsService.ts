import apiClient from './apiClient';

export type TipCategory = 'free' | 'gg' | 'over25';

export interface BookmakerOdd {
  bookmaker: string;
  odds: string;
}

export interface Tip {
  id: string;
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  prediction: string;
  odds: string;
  bookmaker: string;
  bookmakerOdds: BookmakerOdd[];
  confidence: number;
  reasoning: string;
  category: TipCategory;
  isPremium: boolean;
  isFree: boolean;
  result: 'pending' | 'won' | 'lost' | 'void' | 'postponed';
  createdAt: string;
  locked?: boolean;
}

export interface TipMutationInput extends Partial<Tip> {
  notify?: boolean;
}

// ─── Mapping ────────────────────────────────────────────────

function mapTip(data: Record<string, unknown>): Tip {
  return {
    id: String(data.id),
    fixtureId: data.fixture_id as number,
    homeTeam: data.home_team as string,
    awayTeam: data.away_team as string,
    league: data.league as string,
    matchDate: data.match_date as string,
    prediction: (data.prediction as string) || 'LOCKED',
    odds: (data.odds as string) || '🔒',
    bookmaker: (data.bookmaker as string) || '',
    bookmakerOdds: (data.bookmaker_odds as BookmakerOdd[]) || [],
    confidence: (data.confidence as number) || 0,
    reasoning: (data.reasoning as string) || '',
    category: data.category as TipCategory,
    isPremium: Boolean(data.is_premium),
    isFree: !Boolean(data.is_premium),
    result: data.result as Tip['result'],
    createdAt: data.created_at as string,
    locked: Boolean(data.locked),
  };
}

// ─── Fetching ───────────────────────────────────────────────

export async function getAllTips(): Promise<Tip[]> {
  const res = await apiClient.get('/tips', { params: { date: 'all' } });
  return res.data.map(mapTip);
}

export async function getTodayTips(): Promise<Tip[]> {
  const res = await apiClient.get('/tips');
  return res.data.map(mapTip);
}

export async function getFreeTips(): Promise<Tip[]> {
  const res = await apiClient.get('/tips', { params: { is_free: true } });
  return res.data.map(mapTip);
}

export async function getTipsByCategory(category: TipCategory): Promise<Tip[]> {
  const params: Record<string, unknown> = { category };
  if (category === 'free') {
    params.is_free = true;
  } else {
    params.is_free = false;
  }
  const res = await apiClient.get('/tips', { params });
  return res.data.map(mapTip);
}

export async function getTipStats(): Promise<{ total: number; won: number; lost: number; pending: number; voided: number; postponed: number; winRate: number }> {
  try {
    const res = await apiClient.get('/tips/stats');
    return {
      total: res.data.total,
      won: res.data.won,
      lost: res.data.lost,
      pending: res.data.pending,
      voided: res.data.voided,
      postponed: res.data.postponed ?? 0,
      winRate: res.data.win_rate,
    };
  } catch {
    return { total: 0, won: 0, lost: 0, pending: 0, voided: 0, postponed: 0, winRate: 0 };
  }
}

// ─── CRUD ───────────────────────────────────────────────────

export async function addTip(tip: TipMutationInput): Promise<Tip | null> {
  try {
    const payload = {
      fixture_id: tip.fixtureId,
      home_team: tip.homeTeam,
      away_team: tip.awayTeam,
      league: tip.league,
      match_date: tip.matchDate,
      prediction: tip.prediction,
      odds: tip.odds,
      bookmaker: tip.bookmaker,
      bookmaker_odds: tip.bookmakerOdds,
      confidence: tip.confidence,
      reasoning: tip.reasoning,
      category: tip.category,
      is_free: tip.isFree,
      notify: tip.notify ?? false,
    };
    const res = await apiClient.post('/tips', payload);
    return mapTip(res.data);
  } catch (error) {
    console.error('Failed to add tip:', error);
    return null;
  }
}

export async function updateTip(id: string, updates: Partial<Tip>): Promise<Tip | null> {
  try {
    const payload: Record<string, unknown> = {};
    if (updates.prediction !== undefined) payload.prediction = updates.prediction;
    if (updates.odds !== undefined) payload.odds = updates.odds;
    if (updates.confidence !== undefined) payload.confidence = updates.confidence;
    if (updates.reasoning !== undefined) payload.reasoning = updates.reasoning;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.isFree !== undefined) payload.is_free = updates.isFree;
    if (updates.result !== undefined) payload.result = updates.result;

    const res = await apiClient.put(`/tips/${id}`, payload);
    return mapTip(res.data);
  } catch (error) {
    console.error('Failed to update tip:', error);
    return null;
  }
}

export async function deleteTip(id: string): Promise<boolean> {
  try {
    await apiClient.delete(`/tips/${id}`);
    return true;
  } catch {
    return false;
  }
}
