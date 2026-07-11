import axios from 'axios';
import { FetchLogsResponse } from '@/types/log';

export const LogService = {
  getRecentLogs: async (page: number = 1, limit: number = 100, search: string = '', status: string = '', source: string = 'clickhouse', startTime: string = '', endTime: string = ''): Promise<FetchLogsResponse> => {
    // Calling our Next.js API proxy to avoid CORS and hide the backend URL
    const response = await axios.get<FetchLogsResponse>(`/api/logs?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}&source=${encodeURIComponent(source)}&start_time=${encodeURIComponent(startTime)}&end_time=${encodeURIComponent(endTime)}`);
    return response.data;
  }
};
