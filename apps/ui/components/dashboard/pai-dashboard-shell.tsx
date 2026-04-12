'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BrainCircuit,
  Bot,
  Layers3,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react'

import { Header } from '@/components/layout/header'
import AlgorithmPanel from '@/components/algorithm/AlgorithmPanel'
import MemoryDashboard from '@/components/memory/MemoryDashboard'
import AgentRoster from '@/components/agents/AgentRoster'
import TelosDashboard from '@/components/telos/TelosDashboard'

const SYSTEM_PILLARS = [
  {
    title: 'Algorithm',
    description: '7-phase execution loop with ISC verification gates.',
    icon: Workflow,
  },
  {
    title: 'Memory',
    description: 'WORK, LEARNING, RESEARCH, SECURITY, and STATE persistence.',
    icon: Layers3,
  },
  {
    title: 'TELOS',
    description: 'Mission, goals, beliefs, strategies, and learned context.',
    icon: BrainCircuit,
  },
  {
    title: 'Agents',
    description: 'Specialist personalities routed by task and intent.',
    icon: Bot,
  },
]

const QUICK_LINKS = [
  { label: 'View dashboard route', href: '/dashboard' },
  { label: 'Review architecture', href: '/dashboard#architecture' },
  { label: 'Inspect memory runtime', href: '/dashboard#memory' },
]

type GatewayHealth = {
  status?: string
  ok?: boolean
  uptime?: number
  dependencies?: Array<{ name?: string; status?: string; latencyMs?: number; message?: string }>
}

type MemoryStats = {
  skills?: number
  hooks?: number
  agents?: number
  learnings?: number
  ratings?: number
}

type CurrentWork = {
  task?: string
  phase?: string
  effort?: string
  progress?: string
}

type GatewayStatus = {
  model?: {
    provider?: string
    model?: string
  }
  agent?: {
    status?: string
  }
  scheduler?: {
    heartbeatRunning?: boolean
  }
}

export function PAIDashboardShell() {
  const [gateway, setGateway] = useState<GatewayHealth | null>(null)
  const [status, setStatus] = useState<GatewayStatus | null>(null)
  const [stats, setStats] = useState<MemoryStats | null>(null)
  const [currentWork, setCurrentWork] = useState<CurrentWork | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  useEffect(() => {
    let cancelled = false

    const readJson = async <T,>(response: Response): Promise<T | null> => {
      try {
        return (await response.json()) as T
      } catch {
        return null
      }
    }

    const load = async () => {
      try {
        const [healthRes, statsRes, workRes] = await Promise.allSettled([
          fetch('/api/ag3nt/gateway/health', { cache: 'no-store' }),
          fetch('/api/ag3nt/gateway/status', { cache: 'no-store' }),
          fetch('/api/memory/stats', { cache: 'no-store' }),
          fetch('/api/memory/current-work', { cache: 'no-store' }),
        ])

        if (cancelled) return

        if (healthRes.status === 'fulfilled') {
          setGateway((await readJson<GatewayHealth>(healthRes.value)) || null)
        }

        if (statusRes.status === 'fulfilled') {
          setStatus((await readJson<GatewayStatus>(statusRes.value)) || null)
        }

        if (statsRes.status === 'fulfilled') {
          setStats((await readJson<MemoryStats>(statsRes.value)) || null)
        }

        if (workRes.status === 'fulfilled') {
          setCurrentWork((await readJson<CurrentWork>(workRes.value)) || null)
        }

        setLastUpdated(new Date().toLocaleTimeString())
      } catch {
        if (!cancelled) {
          setGateway(null)
        }
      }
    }

    load()
    const interval = window.setInterval(load, 30_000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])

  const dependencySummary = gateway?.dependencies?.map((dep) => `${dep.name || 'dep'}:${dep.status || 'unknown'}`).join(' · ')

  return (
    <div data-testid="pai-dashboard-shell" className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.12),_transparent_32%),linear-gradient(180deg,_#050816_0%,_#0b1220_42%,_#04070f_100%)] text-slate-100">
      <Header />

      <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/25 bg-teal-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-teal-200">
                <Sparkles className="h-3.5 w-3.5" />
                PAI Control Plane
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                  AG3NT as a persistent personal AI infrastructure layer.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  This workspace exposes the core PAI primitives directly: algorithmic execution,
                  persistent memory, TELOS goals, specialist agents, and a local-first operator surface.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {QUICK_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {link.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 sm:grid-cols-2 xl:w-[420px] xl:grid-cols-1">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="rounded-xl bg-teal-400/15 p-2 text-teal-200">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Local-first by default</div>
                  <div className="text-xs text-slate-400">Compatibility preserved while the architecture is hardened.</div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="rounded-xl bg-cyan-400/15 p-2 text-cyan-200">
                  <Workflow className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">7-phase loop enabled</div>
                  <div className="text-xs text-slate-400">Observe → Think → Plan → Build → Execute → Verify → Learn.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {SYSTEM_PILLARS.map((pillar) => {
              const Icon = pillar.icon

              return (
                <article
                  key={pillar.title}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 transition-transform hover:-translate-y-0.5 hover:border-white/15"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-white/10 p-2 text-cyan-200">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-white">{pillar.title}</h2>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">PAI primitive</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{pillar.description}</p>
                </article>
              )
            })}
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
            <div data-testid="pai-dashboard-live" className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.28em] text-cyan-200/80">Live runtime</p>
                  <h2 className="mt-1 text-lg font-semibold text-white">Gateway, memory, and work state</h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Updated {lastUpdated || 'moments ago'}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Gateway</div>
                  <div className="mt-2 text-lg font-semibold text-white">{gateway?.status || (gateway?.ok ? 'healthy' : 'offline')}</div>
                  <div className="mt-1 text-xs text-slate-400">{gateway?.uptime ? `${Math.floor(gateway.uptime / 60)}m uptime` : 'Waiting for health data'}</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Model</div>
                  <div className="mt-2 text-lg font-semibold text-white">{status?.model?.provider || 'unknown'}</div>
                  <div className="mt-1 text-xs text-slate-400">{status?.model?.model || 'No model configured'}</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Agent</div>
                  <div className="mt-2 text-lg font-semibold text-white">{status?.agent?.status || 'unknown'}</div>
                  <div className="mt-1 text-xs text-slate-400">Worker connectivity from gateway</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Skills</div>
                  <div className="mt-2 text-lg font-semibold text-white">{stats?.skills ?? 0}</div>
                  <div className="mt-1 text-xs text-slate-400">Bundled skill directories</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Hooks</div>
                  <div className="mt-2 text-lg font-semibold text-white">{stats?.hooks ?? 0}</div>
                  <div className="mt-1 text-xs text-slate-400">Lifecycle event handlers</div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="rounded-2xl border border-white/10 bg-[#08101d] px-4 py-3 text-sm text-slate-300">
                  <span className="font-medium text-white">Current work:</span>{' '}
                  {currentWork?.task || 'No active work item'}
                  {currentWork?.phase ? ` · ${currentWork.phase}` : ''}
                  {currentWork?.effort ? ` · ${currentWork.effort}` : ''}
                </div>
                <div className="text-xs text-slate-500 lg:text-right">
                  {dependencySummary || 'No dependency summary yet'}
                </div>
              </div>
            </div>

            <div data-testid="pai-dashboard-signals" className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs font-medium uppercase tracking-[0.28em] text-cyan-200/80">Signals</div>
              <div className="mt-3 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-medium text-white">Ratings</div>
                  <div className="mt-1 text-2xl font-semibold text-teal-200">{stats?.ratings ?? 0}</div>
                  <div className="mt-1 text-xs text-slate-400">User feedback samples captured</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-medium text-white">Learnings</div>
                  <div className="mt-1 text-2xl font-semibold text-fuchsia-200">{stats?.learnings ?? 0}</div>
                  <div className="mt-1 text-xs text-slate-400">Captured memory entries</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-medium text-white">Agents</div>
                  <div className="mt-1 text-2xl font-semibold text-fuchsia-200">{stats?.agents ?? 0}</div>
                  <div className="mt-1 text-xs text-slate-400">Specialist personalities loaded</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="architecture" className="grid gap-6 xl:grid-cols-[1.3fr_0.95fr]">
          <div data-testid="pai-dashboard-architecture" className="space-y-6 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.28em] text-cyan-200/80">Runtime overview</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Algorithm and memory as live system state</h2>
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200 sm:inline-flex">
                <Sparkles className="h-3.5 w-3.5" />
                Reused from existing widgets
              </div>
            </div>

            <div className="grid gap-6 2xl:grid-cols-2">
              <section id="algorithm" className="rounded-3xl border border-white/10 bg-[#08101d] p-4">
                <AlgorithmPanel />
              </section>

              <section id="memory" className="rounded-3xl border border-white/10 bg-[#08101d] p-4">
                <MemoryDashboard />
              </section>
            </div>
          </div>

          <aside className="space-y-6">
            <section data-testid="pai-dashboard-telos" className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.28em] text-cyan-200/80">Identity layer</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">TELOS drives the assistant</h2>
                </div>
              </div>
              <div className="mt-4 rounded-3xl border border-white/10 bg-[#08101d] p-4">
                <TelosDashboard />
              </div>
            </section>

            <section data-testid="pai-dashboard-agents" className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.28em] text-cyan-200/80">Delegation layer</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">Specialist agent roster</h2>
                </div>
              </div>
              <div className="mt-4 rounded-3xl border border-white/10 bg-[#08101d] p-4">
                <AgentRoster />
              </div>
            </section>
          </aside>
        </section>
      </main>
    </div>
  )
}