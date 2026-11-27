import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ImpactStats, NotificationItem, PublicUser } from '../../shared/types.ts';
import { apiRequest, setAuthToken } from '../lib/api.ts';

export type AppPage =
  | 'home'
  | 'explore'
  | 'how-it-works'
  | 'community'
  | 'about'
  | 'support'
  | 'dashboard'
  | 'admin';

export type AuthModalMode = 'login' | 'register' | 'forgot' | 'verify' | 'admin-claim' | null;

export interface ToastItem {
  id: string;
  tone: 'success' | 'error' | 'info';
  message: string;
}

interface ServerConfig {
  googleAuthConfigured: boolean;
  adminClaimRequired: boolean;
  adminEnvConfigured: boolean;
}

interface AppContextValue {
  page: AppPage;
  navigate: (next: AppPage) => void;
  user: PublicUser | null;
  setUser: React.Dispatch<React.SetStateAction<PublicUser | null>>;
  authModal: AuthModalMode;
  openAuthModal: (mode: AuthModalMode) => void;
  closeAuthModal: () => void;
  verificationCodeHint: string | null;
  setVerificationCodeHint: (code: string | null) => void;
  serverConfig: ServerConfig;
  refreshConfig: () => Promise<void>;
  impactStats: ImpactStats | null;
  refreshImpactStats: () => Promise<void>;
  notifications: NotificationItem[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  logout: () => void;
  onAuthSuccess: (token: string, user: PublicUser, verificationHint?: string | null) => void;
  userLocation: { lat: number; lng: number; source: 'gps' | 'default' };
  requestLocation: () => void;
  toasts: ToastItem[];
  showToast: (message: string, tone?: ToastItem['tone']) => void;
  dismissToast: (id: string) => void;
  donateModalOpen: boolean;
  openDonateModal: () => void;
  closeDonateModal: () => void;
  dataVersion: number;
  bumpDataVersion: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [page, setPage] = useState<AppPage>('home');
  const [user, setUser] = useState<PublicUser | null>(null);
  const [authModal, setAuthModal] = useState<AuthModalMode>(null);
  const [verificationCodeHint, setVerificationCodeHint] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [donateModalOpen, setDonateModalOpen] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [serverConfig, setServerConfig] = useState<ServerConfig>({
    googleAuthConfigured: false,
    adminClaimRequired: true,
    adminEnvConfigured: false,
  });
  const [impactStats, setImpactStats] = useState<ImpactStats | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; source: 'gps' | 'default' }>({
    lat: 12.9716,
    lng: 77.5946,
    source: 'default',
  });

  const showToast = useCallback((message: string, tone: ToastItem['tone'] = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, tone, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const navigate = useCallback((next: AppPage) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const refreshConfig = useCallback(async () => {
    try {
      const cfg = await apiRequest<ServerConfig>('/config');
      setServerConfig(cfg);
    } catch {
      // Non-fatal
    }
  }, []);

  const refreshImpactStats = useCallback(async () => {
    try {
      const stats = await apiRequest<ImpactStats>('/stats/impact');
      setImpactStats(stats);
    } catch {
      // Non-fatal
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const res = await apiRequest<{ notifications: NotificationItem[] }>('/notifications');
      setNotifications(res.notifications);
    } catch {
      // Ignore if signed out
    }
  }, []);

  useEffect(() => {
    void refreshConfig();
    void refreshImpactStats();
  }, [refreshConfig, refreshImpactStats, dataVersion]);

  useEffect(() => {
    if (user) {
      void refreshNotifications();
    } else {
      setNotifications([]);
    }
  }, [user, dataVersion, refreshNotifications]);

  const markNotificationRead = useCallback(async (id: string) => {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      // ignore
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      showToast('All notifications marked as read.', 'info');
    } catch {
      // ignore
    }
  }, [showToast]);

  const onAuthSuccess = useCallback(
    (token: string, nextUser: PublicUser, verificationHint?: string | null) => {
      setAuthToken(token);
      setUser(nextUser);
      if (verificationHint) {
        setVerificationCodeHint(verificationHint);
        setAuthModal('verify');
      } else {
        setAuthModal(null);
      }
      setDataVersion((v) => v + 1);
      void refreshConfig();
    },
    [refreshConfig],
  );

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    setNotifications([]);
    setVerificationCodeHint(null);
    if (page === 'dashboard' || page === 'admin') {
      setPage('home');
    }
    showToast('You have been signed out.', 'info');
  }, [page, showToast]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported in this browser.', 'info');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          source: 'gps',
        });
        showToast('Location updated for nearby distance sorting.', 'success');
      },
      () => {
        showToast('Using Bengaluru center as fallback location.', 'info');
      },
      { timeout: 6000 },
    );
  }, [showToast]);

  const openDonateModal = useCallback(() => {
    if (!user) {
      setAuthModal('register');
      showToast('Create an account or sign in to share surplus food.', 'info');
      return;
    }
    setDonateModalOpen(true);
  }, [user, showToast]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        page,
        navigate,
        user,
        setUser,
        authModal,
        openAuthModal: setAuthModal,
        closeAuthModal: () => setAuthModal(null),
        verificationCodeHint,
        setVerificationCodeHint,
        serverConfig,
        refreshConfig,
        impactStats,
        refreshImpactStats,
        notifications,
        unreadCount,
        refreshNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        logout,
        onAuthSuccess,
        userLocation,
        requestLocation,
        toasts,
        showToast,
        dismissToast,
        donateModalOpen,
        openDonateModal,
        closeDonateModal: () => setDonateModalOpen(false),
        dataVersion,
        bumpDataVersion: () => setDataVersion((v) => v + 1),
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
