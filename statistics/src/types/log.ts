export interface Log {
  event_time: string;
  ingested_at: string;
  request_id: string;
  service_name: string;
  client_ip: string;
  method: string;
  path: string;
  status_code: number;
  status_group: string;
  latency_ms: number;
  is_error: number;
  user_agent: string;
  raw_message: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface FetchLogsResponse {
  success: boolean;
  data: Log[];
  pagination?: Pagination;
  error?: string;
}
