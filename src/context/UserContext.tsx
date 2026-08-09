import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authService } from '../services/authService';

export interface UserData {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  is_admin: boolean;
  subscription: {
    tier: string;
    expiresAt: string;
  };
  subscription_entitlements: Array<Record<string, unknown>>;
  favorite_teams: string[];
  profile_picture?: string;
  referral_code?: string;
  referrals_count: number;
  referral_points: number;
  unlocked_tip_ids: number[];
  reg_number?: string;
  campus?: string;
  faculty?: string;
  department?: string;
  course?: string;
  year_of_study?: string;
  semester?: string;
}

interface UserContextType {
  user: UserData | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  logout: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authService.me();
      setUser(userData);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  useEffect(() => {
    refreshUser();

    const handleUnauthorized = () => {
      setUser(null);
      setLoading(false);
    };

    const handleConflict = () => {
      setUser(null);
      setLoading(false);
      alert('Your session was ended because your account was logged in on another device.');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener('auth:conflict', handleConflict);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('auth:conflict', handleConflict);
    };
  }, [refreshUser]);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

export default UserContext;
