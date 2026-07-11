"use client"

import React, { useState } from "react"
import { LogsTab } from "@/components/dashboard/LogsTab"
import { OverviewTab } from "@/components/dashboard/OverviewTab"

export default function DashboardContainer() {
  const [activeTab, setActiveTab] = useState<'overview' | 'logs'>('overview')

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Tab Navigation */}
      <div className="flex items-center space-x-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'logs'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Details (Logs)
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'logs' && <LogsTab />}
      </div>
    </div>
  )
}
