"use client"

import React, { useEffect, useState, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  RefreshCw, Server, Activity, ChevronLeft, ChevronRight,
  MessageSquare, BarChart2, AlertTriangle, Copy, Check
} from "lucide-react"
import axios from "axios"

// ── Types ──────────────────────────────────────────────────────────────────

interface TopicStats {
  name: string;
  partitions: number;
  message_count: number;
}

interface KafkaMessage {
  offset: number;
  partition: number;
  key: string;
  value: string;
  time: string;
}

interface TopicMessagesResult {
  topic: string;
  total_count: number;
  messages: KafkaMessage[];
  page: number;
  limit: number;
  total_pages: number;
}

interface RetryTopicStats {
  total_messages: number;
  unique_messages: number;
}

const TOPICS = ["raw-logs", "raw-logs-retry", "raw-logs-dlq"]

function getTopicColor(name: string) {
  if (name.includes("dlq")) return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", badge: "destructive" as const }
  if (name.includes("retry")) return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", badge: "warning" as const }
  return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", badge: "success" as const }
}

function getTopicType(name: string) {
  if (name.includes("dlq")) return "Dead Letter Queue"
  if (name.includes("retry")) return "Retry Queue"
  return "Main Log Queue"
}

function tryParseJson(val: string) {
  try {
    return JSON.stringify(JSON.parse(val), null, 2)
  } catch {
    return val
  }
}

// ── CopyButton ─────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={handleCopy} className="p-1 rounded hover:bg-gray-200 transition-colors" title="Copy">
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-gray-500" />}
    </button>
  )
}

// ── TopicCard ──────────────────────────────────────────────────────────────

function TopicCard({
  topic,
  onViewMessages,
}: {
  topic: TopicStats;
  onViewMessages: (name: string) => void;
}) {
  const c = getTopicColor(topic.name)
  return (
    <div className={`rounded-2xl border ${c.border} p-5 shadow-sm hover:shadow-md transition-all bg-white`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${c.bg}`}>
            <Activity className={`h-5 w-5 ${c.text}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 leading-tight">{topic.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{getTopicType(topic.name)}</p>
          </div>
        </div>
        <Badge variant={topic.partitions > 0 ? "success" : "destructive"}>
          {topic.partitions > 0 ? "Active" : "Not Found"}
        </Badge>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between py-1.5 border-b border-gray-100">
          <span className="text-gray-500">Partitions</span>
          <span className="font-semibold">{topic.partitions}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-gray-100">
          <span className="text-gray-500">Total Messages</span>
          <span className={`font-bold text-base ${c.text}`}>{(topic.message_count ?? 0).toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onViewMessages(topic.name)}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg ${c.bg} ${c.text} hover:opacity-80 transition-opacity`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          View Messages
        </button>
      </div>
    </div>
  )
}

// ── MessagesPanel ──────────────────────────────────────────────────────────

function MessagesPanel({
  topic,
  retryStats,
  onClose,
}: {
  topic: string;
  retryStats: RetryTopicStats | null;
  onClose: () => void;
}) {
  const [result, setResult] = useState<TopicMessagesResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const c = getTopicColor(topic)

  const fetchMessages = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/kafka/messages?topic=${encodeURIComponent(topic)}&page=${p}&limit=${limit}`)
      if (res.data.success) setResult(res.data.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [topic, limit])

  useEffect(() => {
    setPage(1)
    fetchMessages(1)
  }, [fetchMessages])

  const goToPage = (p: number) => {
    setPage(p)
    fetchMessages(p)
    setExpandedIdx(null)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`px-5 py-4 flex items-center justify-between border-b ${c.border} ${c.bg}`}>
        <div className="flex items-center gap-3">
          <MessageSquare className={`h-5 w-5 ${c.text}`} />
          <div>
            <h3 className={`font-semibold ${c.text}`}>{topic}</h3>
            {result && (
              <p className="text-xs text-gray-500 mt-0.5">
                {result.total_count.toLocaleString()} messages total
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      </div>

      {/* Retry Stats Banner */}
      {topic === "raw-logs-retry" && retryStats && (
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-200 flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-medium text-amber-700">Total Messages:</span>
            <span className="text-sm font-bold text-amber-800">{retryStats.total_messages.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-medium text-amber-700">Unique Messages:</span>
            <span className="text-sm font-bold text-amber-800">{retryStats.unique_messages.toLocaleString()}</span>
          </div>
          {retryStats.total_messages > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-600">
                Duplicate rate: {(((retryStats.total_messages - retryStats.unique_messages) / retryStats.total_messages) * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="divide-y divide-gray-100">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : !result || result.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <MessageSquare className="h-8 w-8 mb-2" />
            <p className="text-sm">No messages found in this topic</p>
          </div>
        ) : (
          result.messages.map((msg, idx) => (
            <div key={idx} className="hover:bg-gray-50 transition-colors">
              {/* Row header */}
              <button
                className="w-full px-5 py-3 flex items-start gap-4 text-left"
                onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="shrink-0 text-xs font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                    P{msg.partition} / {msg.offset}
                  </span>
                  <span className="text-xs text-gray-500 shrink-0">
                    {new Date(msg.time).toLocaleString()}
                  </span>
                  {msg.key && (
                    <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded truncate max-w-[120px]">
                      key: {msg.key}
                    </span>
                  )}
                  <span className="text-xs text-gray-400 truncate flex-1 min-w-0 hidden sm:block">
                    {msg.value.slice(0, 80)}{msg.value.length > 80 ? '…' : ''}
                  </span>
                </div>
                <span className="text-xs text-gray-400 shrink-0 mt-0.5">
                  {expandedIdx === idx ? '▲' : '▼'}
                </span>
              </button>

              {/* Expanded JSON */}
              {expandedIdx === idx && (
                <div className="px-5 pb-4">
                  <div className="relative bg-gray-900 rounded-xl overflow-hidden">
                    <div className="absolute top-3 right-3">
                      <CopyButton text={msg.value} />
                    </div>
                    <pre className="text-xs text-green-400 p-4 overflow-x-auto max-h-80 font-mono leading-relaxed">
                      {tryParseJson(msg.value)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {result && result.total_pages > 1 && (
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Page {page} of {result.total_pages} · {result.total_count.toLocaleString()} total
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(5, result.total_pages) }, (_, i) => {
              const p = Math.max(1, Math.min(result.total_pages - 4, page - 2)) + i
              return (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`w-8 h-8 text-xs rounded-lg border transition-colors ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= result.total_pages}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function KafkaMonitorPage() {
  const [stats, setStats] = useState<TopicStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [retryStats, setRetryStats] = useState<RetryTopicStats | null>(null)

  const fetchStats = async () => {
    try {
      const res = await axios.get("/api/kafka")
      if (res.data.success) {
        setStats(res.data.data)
        setError(null)
      } else {
        setError(res.data.error || "Failed to fetch Kafka stats")
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
    }
  }

  const fetchRetryStats = async () => {
    try {
      const res = await axios.get("/api/kafka/retry-stats")
      if (res.data.success) setRetryStats(res.data.data)
    } catch { /* silent */ }
  }

  useEffect(() => {
    Promise.all([fetchStats(), fetchRetryStats()]).finally(() => setLoading(false))
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([fetchStats(), fetchRetryStats()])
    setIsRefreshing(false)
  }

  const handleViewMessages = (topic: string) => {
    setSelectedTopic(topic === selectedTopic ? null : topic)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Server className="h-6 w-6 text-blue-600" />
            </div>
            Kafka Monitor
          </h1>
          <p className="text-gray-500 text-sm mt-1">Real-time monitoring of Kafka topics, partitions and messages</p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing || loading} size="sm" variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <RefreshCw className="h-8 w-8 animate-spin mb-3 text-blue-500" />
          <p className="text-sm">Connecting to Kafka Broker…</p>
        </div>
      ) : (
        <>
          {/* Topic Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {stats.map((topic) => (
              <TopicCard
                key={topic.name}
                topic={topic}
                onViewMessages={handleViewMessages}
              />
            ))}
          </div>

          {/* Retry Stats summary card (always visible) */}
          {retryStats && retryStats.total_messages > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="h-5 w-5 text-amber-600" />
                <h3 className="font-semibold text-amber-800">raw-logs-retry Statistics</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 border border-amber-200 text-center">
                  <p className="text-2xl font-bold text-amber-700">{retryStats.total_messages.toLocaleString()}</p>
                  <p className="text-xs text-amber-600 mt-1">Total Messages</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-amber-200 text-center">
                  <p className="text-2xl font-bold text-amber-700">{retryStats.unique_messages.toLocaleString()}</p>
                  <p className="text-xs text-amber-600 mt-1">Unique Messages</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-amber-200 text-center">
                  <p className="text-2xl font-bold text-amber-700">
                    {retryStats.total_messages > 0
                      ? (retryStats.total_messages - retryStats.unique_messages).toLocaleString()
                      : 0}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">Duplicates</p>
                </div>
              </div>
            </div>
          )}

          {/* Messages Panel */}
          {selectedTopic && (
            <MessagesPanel
              topic={selectedTopic}
              retryStats={selectedTopic === "raw-logs-retry" ? retryStats : null}
              onClose={() => setSelectedTopic(null)}
            />
          )}
        </>
      )}
    </div>
  )
}
