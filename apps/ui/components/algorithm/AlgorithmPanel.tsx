'use client';

import React, { useState, useEffect } from 'react';

/**
 * AlgorithmPanel — Displays real-time 7-phase Algorithm progress.
 * Shows current phase, ISC criteria checklist, and effort level.
 */

interface AlgorithmState {
  task: string;
  phase: string;
  effort: string;
  progress: string;
  started: string;
  updated: string;
}

const PHASES = [
  { key: 'observe', label: 'Observe', icon: '👁️', num: 1 },
  { key: 'think', label: 'Think', icon: '🧠', num: 2 },
  { key: 'plan', label: 'Plan', icon: '📋', num: 3 },
  { key: 'build', label: 'Build', icon: '🔨', num: 4 },
  { key: 'execute', label: 'Execute', icon: '⚡', num: 5 },
  { key: 'verify', label: 'Verify', icon: '✅', num: 6 },
  { key: 'learn', label: 'Learn', icon: '📚', num: 7 },
];

const EFFORT_BADGES: Record<string, { color: string; label: string }> = {
  standard: { color: '#22C55E', label: 'Standard' },
  extended: { color: '#3B82F6', label: 'Extended' },
  advanced: { color: '#A855F7', label: 'Advanced' },
  deep: { color: '#F59E0B', label: 'Deep' },
  comprehensive: { color: '#EF4444', label: 'Comprehensive' },
};

export default function AlgorithmPanel() {
  const [state, setState] = useState<AlgorithmState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlgorithmState();
    const interval = setInterval(fetchAlgorithmState, 3000);
    return () => clearInterval(interval);
  }, []);

  async function fetchAlgorithmState() {
    try {
      const res = await fetch('/api/memory/current-work');
      if (res.ok) {
        const data = await res.json();
        if (data && data.task) {
          setState(data);
        } else {
          setState(null);
        }
      }
    } catch {
      // Silent failure
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="algorithm-panel algorithm-panel--loading">
        <div className="algorithm-panel__spinner" />
        <span>Loading Algorithm state...</span>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="algorithm-panel algorithm-panel--idle">
        <div className="algorithm-panel__icon">♻️</div>
        <h3 className="algorithm-panel__title">Algorithm Engine</h3>
        <p className="algorithm-panel__subtitle">No active task. Start a complex request to activate the Algorithm.</p>
      </div>
    );
  }

  const currentPhaseIdx = PHASES.findIndex(p => p.key === state.phase);
  const effortBadge = EFFORT_BADGES[state.effort] || EFFORT_BADGES.standard;
  const [checked, total] = state.progress.split('/').map(Number);
  const progressPercent = total > 0 ? Math.round((checked / total) * 100) : 0;

  return (
    <div className="algorithm-panel algorithm-panel--active">
      <div className="algorithm-panel__header">
        <h3 className="algorithm-panel__title">♻️ Algorithm v3.7.0</h3>
        <span 
          className="algorithm-panel__effort-badge"
          style={{ backgroundColor: effortBadge.color }}
        >
          {effortBadge.label}
        </span>
      </div>

      <p className="algorithm-panel__task">{state.task}</p>

      {/* Phase Stepper */}
      <div className="algorithm-panel__phases">
        {PHASES.map((phase, idx) => {
          let status = 'pending';
          if (idx < currentPhaseIdx) status = 'complete';
          else if (idx === currentPhaseIdx) status = 'active';

          return (
            <div key={phase.key} className={`algorithm-phase algorithm-phase--${status}`}>
              <div className="algorithm-phase__icon">{phase.icon}</div>
              <div className="algorithm-phase__label">{phase.label}</div>
              <div className="algorithm-phase__num">{phase.num}/7</div>
            </div>
          );
        })}
      </div>

      {/* ISC Progress */}
      <div className="algorithm-panel__progress">
        <div className="algorithm-panel__progress-header">
          <span>ISC Criteria</span>
          <span>{checked}/{total} ({progressPercent}%)</span>
        </div>
        <div className="algorithm-panel__progress-bar">
          <div 
            className="algorithm-panel__progress-fill" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="algorithm-panel__meta">
        <span>Started: {new Date(state.started).toLocaleTimeString()}</span>
        <span>Updated: {new Date(state.updated).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
