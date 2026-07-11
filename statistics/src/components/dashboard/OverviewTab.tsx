"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useLogStore } from "@/stores/useLogStore"
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts"
import { RefreshCw, Clock, TrendingUp, TrendingDown, AlertTriangle, Zap } from "lucide-react"

// ─── Constants ─────────────────────────────────────────────────────────────

const STATUS_PALETTE: Record<string, string> = {
  '200': '#22d3ee',
  '201': '#34d399',
  '400': '#fb923c',
  '401': '#f87171',
  '403': '#e879f9',
  '404': '#facc15',
  '500': '#ef4444',
  '502': '#dc2626',
  '503': '#991b1b',
}

const METHOD_PALETTE: Record<string, string> = {
  GET:    '#38bdf8',
  POST:   '#4ade80',
  PUT:    '#fbbf24',
  PATCH:  '#a78bfa',
  DELETE: '#f87171',
}

const PRESET_RANGES = [
  { label: 'Last 15 min', minutes: 15 },
  { label: 'Last 1 hour', minutes: 60 },
  { label: 'Last 6 hours', minutes: 360 },
  { label: 'Last 24 hours', minutes: 1440 },
  { label: 'Last 7 days', minutes: 10080 },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

function toLocalDatetimeInput(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalDatetimeInput(val: string): string {
  return new Date(val).toISOString()
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string
}) {
  return (
    <div className={`relative overflow-hidden bg-white rounded-2xl border shadow-sm p-6 flex items-start gap-4 group hover:shadow-md transition-shadow`}>
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 shrink-0`}>
        <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-gray-900 leading-none">{value}</h3>
        {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
      </div>
      <div className={`absolute -right-4 -bottom-4 h-20 w-20 rounded-full ${color} opacity-5 group-hover:opacity-10 transition-opacity`} />
    </div>
  )
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl border border-gray-700">
      <p className="font-medium mb-1 text-gray-300">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || p.fill || '#fff' }}>
          {p.name}: <span className="font-bold">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </p>
      ))}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function OverviewTab() {
  const {
    analyticsData,
    analyticsLoading,
    fetchAnalytics,
    analyticsStartTime,
    analyticsEndTime,
    setAnalyticsTimeRange,
  } = useLogStore()

  const [localStart, setLocalStart] = useState(() => toLocalDatetimeInput(analyticsStartTime))
  const [localEnd, setLocalEnd] = useState(() => toLocalDatetimeInput(analyticsEndTime))
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  const handleApply = useCallback(() => {
    const s = fromLocalDatetimeInput(localStart)
    const e = fromLocalDatetimeInput(localEnd)
    setAnalyticsTimeRange(s, e)
  }, [localStart, localEnd, setAnalyticsTimeRange])

  const handlePreset = useCallback((minutes: number) => {
    const end = new Date()
    const start = new Date(end.getTime() - minutes * 60 * 1000)
    const s = start.toISOString()
    const e = end.toISOString()
    setLocalStart(toLocalDatetimeInput(s))
    setLocalEnd(toLocalDatetimeInput(e))
    setAnalyticsTimeRange(s, e)
  }, [setAnalyticsTimeRange])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchAnalytics()
    setIsRefreshing(false)
  }

  const isLoading = analyticsLoading && !analyticsData

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-blue-500 border-t-transparent" />
        <p className="text-sm text-gray-400">Loading analytics…</p>
      </div>
    </div>
  )

  if (!analyticsData) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400">No analytics data. Check that the Go service is running.</p>
    </div>
  )

  const {
    total_requests, total_errors, avg_latency,
    requests_over_time, errors_over_time, latency_over_time,
    status_distribution, method_distribution, top_endpoints, top_client_ips,
  } = analyticsData

  const errorRate = total_requests > 0 ? ((total_errors / total_requests) * 100).toFixed(2) : "0.00"
  const successCount = total_requests - total_errors

  // Merge requests + errors into one series for dual area chart
  const mergedOverTime = requests_over_time.map(r => {
    const errRow = errors_over_time.find(e => e.time === r.time)
    return { time: fmtTime(r.time), requests: r.count, errors: errRow?.count ?? 0 }
  })

  const formattedLatency = latency_over_time.map(l => ({
    time: fmtTime(l.time), latency: Math.round(l.avg_latency)
  }))

  const formattedStatus = status_distribution.map(s => ({
    name: String(s.status_code), value: Number(s.count)
  }))

  const methodRadar = method_distribution.map(m => ({
    method: m.method, count: Number(m.count)
  }))

  const formattedEndpoints = top_endpoints.slice(0, 8).map(e => ({
    path: e.path.length > 30 ? '…' + e.path.slice(-28) : e.path,
    fullPath: e.path,
    count: Number(e.count),
  }))

  const formattedIPs = top_client_ips.slice(0, 8).map(ip => ({
    ip: ip.client_ip, count: Number(ip.count)
  }))

  return (
    <div className="space-y-6">
      {/* ── Filter Bar ── */}
      <div className="bg-white rounded-2xl border shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <Clock className="h-4 w-4 text-gray-400 shrink-0" />
        <div className="flex flex-wrap gap-2">
          {PRESET_RANGES.map(p => (
            <button
              key={p.minutes}
              onClick={() => handlePreset(p.minutes)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="h-5 w-px bg-gray-200 hidden sm:block" />
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="datetime-local"
            value={localStart}
            onChange={e => setLocalStart(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <span className="text-gray-400 text-xs">→</span>
          <input
            type="datetime-local"
            value={localEnd}
            onChange={e => setLocalEnd(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleApply}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Apply
          </button>
        </div>
        <div className="ml-auto">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg border border-gray-200 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Requests"
          value={total_requests.toLocaleString()}
          icon={TrendingUp}
          color="bg-blue-500"
        />
        <KpiCard
          label="Total Errors"
          value={total_errors.toLocaleString()}
          sub={`${errorRate}% of total`}
          icon={AlertTriangle}
          color="bg-red-500"
        />
        <KpiCard
          label="Avg Latency"
          value={`${avg_latency.toFixed(1)} ms`}
          icon={Zap}
          color="bg-amber-500"
        />
        <KpiCard
          label="Success Rate"
          value={`${total_requests > 0 ? ((successCount / total_requests) * 100).toFixed(1) : 0}%`}
          sub={`${successCount.toLocaleString()} successful`}
          icon={TrendingDown}
          color="bg-emerald-500"
        />
      </div>

      {/* ── Row 1: Traffic + Latency ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="Traffic Overview" subtitle="Requests vs Errors over time">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mergedOverTime} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                <defs>
                  <linearGradient id="gradRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradErrors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                <Area type="monotone" dataKey="requests" name="Requests" stroke="#3b82f6" strokeWidth={2} fill="url(#gradRequests)" dot={false} activeDot={{ r: 5 }} />
                <Area type="monotone" dataKey="errors" name="Errors" stroke="#ef4444" strokeWidth={2} fill="url(#gradErrors)" dot={false} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Latency Trend" subtitle="Average response time (ms)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedLatency} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                <defs>
                  <linearGradient id="gradLatency" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit="ms" />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="latency" name="Avg Latency (ms)" stroke="url(#gradLatency)" strokeWidth={2.5} dot={false} activeDot={{ r: 6, fill: '#f59e0b' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* ── Row 2: Status Pie + Method Radar ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="HTTP Status Distribution" subtitle="Response code breakdown">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={formattedStatus}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {formattedStatus.map((entry, i) => (
                    <Cell key={i} fill={STATUS_PALETTE[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="HTTP Method Distribution" subtitle="Requests by HTTP verb">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {methodRadar.length > 0 ? (
                <RadarChart cx="50%" cy="50%" outerRadius={90} data={methodRadar}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="method" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Radar name="Requests" dataKey="count" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} strokeWidth={2} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              ) : (
                <BarChart data={method_distribution.map(m => ({ method: m.method, count: Number(m.count) }))} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="method" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Requests" radius={[6, 6, 0, 0]}>
                    {method_distribution.map((m, i) => (
                      <Cell key={i} fill={METHOD_PALETTE[m.method] || '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* ── Row 3: Top Endpoints + Top IPs ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="Top Endpoints" subtitle="Most called API paths">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedEndpoints} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis
                  dataKey="path"
                  type="category"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  width={170}
                />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  return (
                    <div className="bg-gray-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl max-w-xs break-all">
                      <p className="font-medium text-gray-300 mb-1">{d.fullPath}</p>
                      <p className="text-blue-400">Count: <span className="font-bold">{d.count.toLocaleString()}</span></p>
                    </div>
                  )
                }} />
                <Bar dataKey="count" name="Requests" radius={[0, 6, 6, 0]} barSize={18}>
                  {formattedEndpoints.map((_, i) => (
                    <Cell key={i} fill={`hsl(${220 + i * 12}, 80%, ${55 + i * 2}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Top Client IPs" subtitle="Most active source IPs">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedIPs} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis
                  dataKey="ip"
                  type="category"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  width={110}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Requests" radius={[0, 6, 6, 0]} barSize={18}>
                  {formattedIPs.map((_, i) => (
                    <Cell key={i} fill={`hsl(${160 + i * 15}, 70%, ${50 + i * 2}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  )
}
