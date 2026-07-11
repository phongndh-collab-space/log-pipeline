"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, LayoutDashboard, Settings, Server } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/')

  return (
    <div className="flex min-h-screen bg-surface-soft">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border hidden md:block">
        <div className="flex h-16 items-center px-6 border-b border-border">
          <Activity className="h-6 w-6 text-primary mr-2" />
          <span className="font-bold text-lg text-ink">Log Stats</span>
        </div>
        <nav className="p-4 space-y-2">
          <Link
            href="/dashboard"
            className={`flex items-center px-4 py-2.5 rounded-lg font-medium transition-colors ${isActive('/dashboard')
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-surface-soft hover:text-ink'
              }`}
          >
            <LayoutDashboard className="h-5 w-5 mr-3" />
            Dashboard
          </Link>
          <Link
            href="/kafka"
            className={`flex items-center px-4 py-2.5 rounded-lg font-medium transition-colors ${isActive('/kafka')
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-surface-soft hover:text-ink'
              }`}
          >
            <Server className="h-5 w-5 mr-3" />
            Kafka Monitor
          </Link>
          <Link
            href="/settings"
            className={`flex items-center px-4 py-2.5 rounded-lg font-medium transition-colors ${isActive('/settings')
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-surface-soft hover:text-ink'
              }`}
          >
            <Settings className="h-5 w-5 mr-3" />
            Settings
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center md:hidden">
            <Activity className="h-6 w-6 text-primary mr-2" />
            <span className="font-bold text-lg text-ink">Log Stats</span>
          </div>
          <div className="flex-1"></div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              AD
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
