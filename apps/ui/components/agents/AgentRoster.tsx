'use client';

import React from 'react';

/**
 * AgentRoster — Displays available agent personalities.
 * Shows agent cards with personality traits and specializations.
 */

interface AgentProfile {
  name: string;
  specialization: string;
  icon: string;
  color: string;
  traits: {
    precision: number;
    directness: number;
    humor: number;
    warmth: number;
    autonomy: number;
  };
}

const AGENTS: AgentProfile[] = [
  {
    name: 'Algorithm',
    specialization: 'Meta-orchestrator — 7-phase task lifecycle',
    icon: '♻️',
    color: '#3B82F6',
    traits: { precision: 90, directness: 85, humor: 15, warmth: 35, autonomy: 95 },
  },
  {
    name: 'Engineer',
    specialization: 'Code implementation and debugging',
    icon: '⚙️',
    color: '#22C55E',
    traits: { precision: 95, directness: 85, humor: 20, warmth: 40, autonomy: 80 },
  },
  {
    name: 'Architect',
    specialization: 'System design and technical strategy',
    icon: '🏗️',
    color: '#A855F7',
    traits: { precision: 80, directness: 70, humor: 30, warmth: 50, autonomy: 90 },
  },
  {
    name: 'Researcher',
    specialization: 'Information gathering and analysis',
    icon: '🔍',
    color: '#06B6D4',
    traits: { precision: 85, directness: 60, humor: 25, warmth: 55, autonomy: 75 },
  },
  {
    name: 'Designer',
    specialization: 'UI/UX design and visual aesthetics',
    icon: '🎨',
    color: '#EC4899',
    traits: { precision: 70, directness: 65, humor: 45, warmth: 80, autonomy: 70 },
  },
  {
    name: 'QATester',
    specialization: 'Quality assurance and validation',
    icon: '🧪',
    color: '#F59E0B',
    traits: { precision: 95, directness: 90, humor: 15, warmth: 30, autonomy: 85 },
  },
  {
    name: 'SecurityAnalyst',
    specialization: 'Security analysis and threat modeling',
    icon: '🛡️',
    color: '#EF4444',
    traits: { precision: 95, directness: 80, humor: 10, warmth: 25, autonomy: 70 },
  },
  {
    name: 'BrowserAgent',
    specialization: 'Browser automation and web interaction',
    icon: '🌐',
    color: '#8B5CF6',
    traits: { precision: 90, directness: 80, humor: 10, warmth: 20, autonomy: 85 },
  },
];

function TraitBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="trait-bar">
      <span className="trait-bar__label">{label}</span>
      <div className="trait-bar__track">
        <div
          className="trait-bar__fill"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="trait-bar__value">{value}</span>
    </div>
  );
}

export default function AgentRoster() {
  return (
    <div className="agent-roster">
      <h3 className="agent-roster__title">🤖 Agent Roster</h3>
      <p className="agent-roster__subtitle">
        {AGENTS.length} specialized agents available for task delegation
      </p>
      
      <div className="agent-roster__grid">
        {AGENTS.map((agent) => (
          <div key={agent.name} className="agent-card">
            <div className="agent-card__header" style={{ borderTopColor: agent.color }}>
              <span className="agent-card__icon">{agent.icon}</span>
              <h4 className="agent-card__name">{agent.name}</h4>
            </div>
            <p className="agent-card__spec">{agent.specialization}</p>
            <div className="agent-card__traits">
              <TraitBar label="PRC" value={agent.traits.precision} color={agent.color} />
              <TraitBar label="DIR" value={agent.traits.directness} color={agent.color} />
              <TraitBar label="AUT" value={agent.traits.autonomy} color={agent.color} />
              <TraitBar label="WRM" value={agent.traits.warmth} color={agent.color} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
