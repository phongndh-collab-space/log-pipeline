"use client"

import React, { useEffect, useState, useTransition } from "react"
import { useLogStore } from "@/stores/useLogStore"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const pageSizeOptions = [50, 100, 200, 500]

const methodClasses: Record<string, string> = {
  GET: "border-blue-200 bg-blue-50 text-blue-700",
  POST: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PUT: "border-amber-200 bg-amber-50 text-amber-700",
  PATCH: "border-violet-200 bg-violet-50 text-violet-700",
  DELETE: "border-red-200 bg-red-50 text-red-700",
  OPTIONS: "border-slate-200 bg-slate-50 text-slate-700",
  HEAD: "border-zinc-200 bg-zinc-50 text-zinc-700",
}

function getMethodClass(method: string) {
  return methodClasses[method.toUpperCase()] ?? "border-neutral-200 bg-neutral-50 text-neutral-700"
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "-"
  }
  return date.toLocaleString()
}

export function LogsTab() {
  const {
    logs,
    loading,
    error,
    page,
    limit,
    total,
    totalPages,
    search,
    status,
    source,
    startTime,
    endTime,
    fetchLogs,
    setPage,
    setLimit,
    setFilters,
    setSource,
    setTimeRange
  } = useLogStore()

  const [localSearch, setLocalSearch] = useState(search)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [, startTransition] = useTransition()

  const formatForInput = (isoString: string) => {
    if (!isoString) return ""
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) return ""
    
    const pad = (n: number) => String(n).padStart(2, '0')
    const year = date.getFullYear()
    const month = pad(date.getMonth() + 1)
    const day = pad(date.getDate())
    const hours = pad(date.getHours())
    const minutesVal = pad(date.getMinutes())
    
    return `${year}-${month}-${day}T${hours}:${minutesVal}`
  }

  const [localStart, setLocalStart] = useState(formatForInput(startTime))
  const [localEnd, setLocalEnd] = useState(formatForInput(endTime))

  useEffect(() => {
    setLocalStart(formatForInput(startTime))
    setLocalEnd(formatForInput(endTime))
  }, [startTime, endTime])

  const handleApplyTimeFilter = () => {
    const startIso = localStart ? new Date(localStart).toISOString() : ""
    const endIso = localEnd ? new Date(localEnd).toISOString() : ""
    setTimeRange(startIso, endIso)
  }

  const handleAllTime = () => {
    setLocalStart("")
    setLocalEnd("")
    setTimeRange("", "")
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await fetchLogs(page, limit, search, status, source, startTime, endTime)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Initial load - run only once on mount
  useEffect(() => {
    fetchLogs(1, limit, search, status, source, startTime, endTime)
  }, [fetchLogs]) // Only fetchLogs as dependency to run once

  // Debounced search updates - run only when localSearch changes and is different from current store search
  useEffect(() => {
    if (localSearch === search) return

    const handler = setTimeout(() => {
      startTransition(() => {
        setFilters(localSearch, status)
      })
    }, 400)

    return () => clearTimeout(handler)
  }, [localSearch, search, status, setFilters])

  // Immediate status filter handler
  const handleStatusChange = (newStatus: string) => {
    setFilters(localSearch, newStatus)
  }

  // Generate page numbers for Airbnb styled pagination
  const pageNumbers = React.useMemo(() => {
    const pages: (number | string)[] = []
    const range = 1 // number of pages to show around current page

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      const start = Math.max(2, page - range)
      const end = Math.min(totalPages - 1, page + range)

      if (start > 2) {
        pages.push("...")
      }

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (end < totalPages - 1) {
        pages.push("...")
      }

      pages.push(totalPages)
    }
    return pages
  }, [page, totalPages])

  const startIndex = (page - 1) * limit + 1
  const endIndex = Math.min(page * limit, total)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">System Logs</h1>
          <p className="text-muted-foreground mt-1">
            {source === "clickhouse" ? "Real-time statistics of all tracked events" : "Viewing fallback logs stored in PostgreSQL"}
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing} size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-card rounded-xl border border-border p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search logs by path, service, method, IP..."
            value={localSearch}
            onChange={(event) => setLocalSearch(event.target.value)}
            className="w-full bg-surface-soft border border-border rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => handleStatusChange("all")}>
            <Badge variant={status === "all" ? "default" : "outline"} className="cursor-pointer px-4 py-1 rounded-full text-xs font-semibold">All</Badge>
          </button>
          <button type="button" onClick={() => handleStatusChange("errors")}>
            <Badge variant={status === "errors" ? "destructive" : "outline"} className="cursor-pointer px-4 py-1 rounded-full text-xs font-semibold">Errors</Badge>
          </button>
          <button type="button" onClick={() => handleStatusChange("success")}>
            <Badge variant={status === "success" ? "success" : "outline"} className="cursor-pointer px-4 py-1 rounded-full text-xs font-semibold">Success</Badge>
          </button>
        </div>

        {/* Time Filter */}
        <div className="flex flex-wrap items-center gap-2 border-l border-border pl-4">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Time Range:</span>
          <div className="flex items-center gap-1.5">
            <input
              type="datetime-local"
              value={localStart}
              onChange={(e) => setLocalStart(e.target.value)}
              className="rounded-full border border-border bg-surface-soft px-3 py-1 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-primary h-8 transition-all cursor-pointer"
              title="Start Time"
            />
            <span className="text-xs text-muted-foreground">—</span>
            <input
              type="datetime-local"
              value={localEnd}
              onChange={(e) => setLocalEnd(e.target.value)}
              className="rounded-full border border-border bg-surface-soft px-3 py-1 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-primary h-8 transition-all cursor-pointer"
              title="End Time"
            />
          </div>
          <Button
            type="button"
            onClick={handleApplyTimeFilter}
            size="sm"
            className="h-8 rounded-full px-4 text-xs font-semibold"
          >
            Apply
          </Button>
          <Button
            type="button"
            onClick={handleAllTime}
            variant="outline"
            size="sm"
            className="h-8 rounded-full px-3 text-xs font-semibold"
          >
            All Time
          </Button>
        </div>

        {/* Source Toggle */}
        <div className="flex items-center gap-2 border-l border-border pl-4">
          <button type="button" onClick={() => setSource("clickhouse")}>
            <Badge variant={source === "clickhouse" ? "default" : "outline"} className="cursor-pointer px-4 py-1 rounded-full text-xs font-semibold">Live Logs</Badge>
          </button>
          <button type="button" onClick={() => setSource("postgres")}>
            <Badge variant={source === "postgres" ? "default" : "outline"} className="cursor-pointer px-4 py-1 rounded-full text-xs font-semibold">Backup Logs</Badge>
          </button>
        </div>
      </div>

      {/* Log Table Container */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-soft text-muted-foreground text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Path</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Latency</th>
                <th className="px-6 py-4">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    No logs found. Make some API requests first.
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr key={log.request_id || idx} className="hover:bg-surface-soft/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      {formatTime(log.event_time)}
                    </td>
                    <td className="px-6 py-4 font-medium text-ink">
                      {log.service_name}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`font-mono ${getMethodClass(log.method)}`}>
                        {log.method}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground truncate max-w-[260px]" title={log.path}>
                      {log.path}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={log.is_error === 1 ? "destructive" : "success"}>
                        {log.status_code} ({log.status_group})
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-mono ${log.latency_ms > 500 ? 'text-yellow-600 font-semibold' : 'text-muted-foreground'}`}>
                        {log.latency_ms}ms
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                      {log.client_ip}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Airbnb Style Pagination controls */}
        <div className="flex flex-col gap-4 border-t border-border bg-card px-6 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">

          {/* Rows Per Page Selector */}
          <div className="flex items-center gap-2">
            <span>Show</span>
            <Select value={String(limit)} onValueChange={(val) => setLimit(Number(val))}>
              <SelectTrigger className="w-[85px] rounded-full border border-border bg-surface-soft px-3 py-1.5 text-sm text-ink h-8 focus:outline-none focus:ring-2 focus:ring-primary transition-all cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>logs per page</span>
          </div>

          {/* Page Navigator */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="text-sm font-normal text-muted mr-4">
              {total === 0 ? "No records" : `Showing ${startIndex} – ${endIndex} of ${total} records`}
            </span>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="w-9 h-9 flex items-center justify-center rounded-full border border-border hover:bg-surface-soft disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-ink cursor-pointer disabled:cursor-not-allowed"
                  title="Previous Page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Page Numbers */}
                {pageNumbers.map((p, index) => {
                  if (p === "...") {
                    return (
                      <span key={`dots-${index}`} className="w-9 h-9 flex items-center justify-center text-muted-soft select-none">
                        ...
                      </span>
                    )
                  }

                  const isCurrent = p === page
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p as number)}
                      className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-semibold transition-all border cursor-pointer ${isCurrent
                        ? "bg-primary border-primary text-white shadow-sm hover:bg-primary-active"
                        : "border-transparent text-ink hover:bg-surface-soft"
                        }`}
                    >
                      {p}
                    </button>
                  )
                })}

                {/* Next Button */}
                <button
                  type="button"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="w-9 h-9 flex items-center justify-center rounded-full border border-border hover:bg-surface-soft disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-ink cursor-pointer disabled:cursor-not-allowed"
                  title="Next Page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
