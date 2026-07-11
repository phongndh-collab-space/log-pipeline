export interface TimePoint {
  time: string;
  count: number;
}

export interface LatencyPoint {
  time: string;
  avg_latency: number;
}

export interface StatusCodePoint {
  status_code: number;
  count: number;
}

export interface MethodPoint {
  method: string;
  count: number;
}

export interface EndpointPoint {
  path: string;
  count: number;
}

export interface IpPoint {
  client_ip: string;
  count: number;
}

export interface AnalyticsData {
  total_requests: number;
  total_errors: number;
  avg_latency: number;
  requests_over_time: TimePoint[];
  errors_over_time: TimePoint[];
  latency_over_time: LatencyPoint[];
  status_distribution: StatusCodePoint[];
  method_distribution: MethodPoint[];
  top_endpoints: EndpointPoint[];
  top_client_ips: IpPoint[];
}

export interface FetchAnalyticsResponse {
  success: boolean;
  data?: AnalyticsData;
  error?: string;
}
