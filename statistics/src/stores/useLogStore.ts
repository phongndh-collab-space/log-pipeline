import { create } from 'zustand';
import { Log } from '@/types/log';
import { LogService } from '@/services/log.service';

interface LogState {
  logs: Log[];
  loading: boolean;
  error: string | null;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  search: string;
  status: string;
  source: 'clickhouse' | 'postgres';
  fetchLogs: (page?: number, limit?: number, search?: string, status?: string, source?: 'clickhouse' | 'postgres') => Promise<void>;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setFilters: (search: string, status: string) => void;
  setSource: (source: 'clickhouse' | 'postgres') => void;
  analyticsData: import('@/types/analytics').AnalyticsData | null;
  analyticsLoading: boolean;
  analyticsStartTime: string;
  analyticsEndTime: string;
  fetchAnalytics: (startTime?: string, endTime?: string) => Promise<void>;
  setAnalyticsTimeRange: (startTime: string, endTime: string) => void;
}

export const useLogStore = create<LogState>((set, get) => ({
  logs: [],
  loading: false,
  error: null,
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  search: '',
  status: 'all',
  source: 'clickhouse',
  analyticsData: null,
  analyticsLoading: false,
  analyticsStartTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  analyticsEndTime: new Date().toISOString(),
  fetchLogs: async (page, limit, search, status, source) => {
    const activePage = page !== undefined ? page : get().page;
    const activeLimit = limit !== undefined ? limit : get().limit;
    const activeSearch = search !== undefined ? search : get().search;
    const activeStatus = status !== undefined ? status : get().status;
    const activeSource = source !== undefined ? source : get().source;

    set({ loading: true, error: null });
    try {
      const response = await LogService.getRecentLogs(activePage, activeLimit, activeSearch, activeStatus, activeSource);
      if (response.success) {
        set({
          logs: Array.isArray(response.data) ? response.data : [],
          page: response.pagination?.page || activePage,
          limit: response.pagination?.limit || activeLimit,
          total: response.pagination?.total || 0,
          totalPages: response.pagination?.total_pages || 0,
          search: activeSearch,
          status: activeStatus,
          source: activeSource,
          loading: false,
        });
      } else {
        set({ error: response.error || 'Failed to fetch logs', loading: false });
      }
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'An error occurred',
        loading: false,
      });
    }
  },
  fetchAnalytics: async (startTime?: string, endTime?: string) => {
    set({ analyticsLoading: true });
    const activeStart = startTime || get().analyticsStartTime;
    const activeEnd = endTime || get().analyticsEndTime;
    try {
      const params = new URLSearchParams({
        source: get().source,
        start_time: activeStart,
        end_time: activeEnd,
      });
      const response = await fetch(`/api/logs/analytics?${params.toString()}`);
      const data = await response.json();
      if (data.success && data.data) {
        set({ analyticsData: data.data, analyticsLoading: false });
      } else {
        set({ analyticsLoading: false });
      }
    } catch (err) {
      console.error('Failed to fetch analytics', err);
      set({ analyticsLoading: false });
    }
  },
  setAnalyticsTimeRange: (startTime, endTime) => {
    set({ analyticsStartTime: startTime, analyticsEndTime: endTime });
    get().fetchAnalytics(startTime, endTime);
  },
  setPage: (page) => {
    set({ page });
    get().fetchLogs(page, get().limit, get().search, get().status, get().source);
  },
  setLimit: (limit) => {
    set({ limit, page: 1 });
    get().fetchLogs(1, limit, get().search, get().status, get().source);
  },
  setFilters: (search, status) => {
    set({ search, status, page: 1 });
    get().fetchLogs(1, get().limit, search, status, get().source);
  },
  setSource: (source) => {
    set({ source, page: 1 });
    get().fetchLogs(1, get().limit, get().search, get().status, source);
    get().fetchAnalytics();
  }
}));
