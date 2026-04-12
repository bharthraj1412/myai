'use client';

import React, { useState, useEffect } from 'react';

/**
 * TelosDashboard — Displays user's TELOS (goals, mission, projects).
 * Reads from USER/TELOS/ directory.
 */

interface TelosFile {
  name: string;
  icon: string;
  content: string;
  populated: boolean;
}

const TELOS_FILES = [
  { name: 'MISSION', icon: '🎯' },
  { name: 'GOALS', icon: '🏆' },
  { name: 'PROJECTS', icon: '📁' },
  { name: 'BELIEFS', icon: '💎' },
  { name: 'STRATEGIES', icon: '♟️' },
  { name: 'MODELS', icon: '🧩' },
  { name: 'LEARNED', icon: '📖' },
  { name: 'CHALLENGES', icon: '⚔️' },
  { name: 'IDEAS', icon: '💡' },
  { name: 'NARRATIVES', icon: '📜' },
];

export default function TelosDashboard() {
  const [telosData, setTelosData] = useState<TelosFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTelosData();
  }, []);

  async function fetchTelosData() {
    try {
      const res = await fetch('/api/memory/telos');
      if (res.ok) {
        const data = await res.json();
        setTelosData(data.files || []);
      } else {
        // Fallback: show file list without content
        setTelosData(TELOS_FILES.map(f => ({
          ...f,
          content: '',
          populated: false,
        })));
      }
    } catch {
      setTelosData(TELOS_FILES.map(f => ({
        ...f,
        content: '',
        populated: false,
      })));
    } finally {
      setLoading(false);
    }
  }

  const populatedCount = telosData.filter(f => f.populated).length;
  const selected = telosData.find(f => f.name === selectedFile);

  return (
    <div className="telos-dashboard">
      <div className="telos-dashboard__header">
        <h3 className="telos-dashboard__title">🧭 TELOS — Your Life OS</h3>
        <span className="telos-dashboard__progress">
          {populatedCount}/{telosData.length} configured
        </span>
      </div>

      <p className="telos-dashboard__subtitle">
        Your goals, beliefs, and strategies. AG3NT uses these to personalize every interaction.
      </p>

      {/* TELOS Grid */}
      <div className="telos-grid">
        {(telosData.length > 0 ? telosData : TELOS_FILES.map(f => ({...f, content: '', populated: false}))).map((file) => (
          <button
            key={file.name}
            className={`telos-card ${file.populated ? 'telos-card--active' : 'telos-card--empty'} ${selectedFile === file.name ? 'telos-card--selected' : ''}`}
            onClick={() => setSelectedFile(file.name === selectedFile ? null : file.name)}
          >
            <span className="telos-card__icon">{file.icon}</span>
            <span className="telos-card__name">{file.name}</span>
            {!file.populated && <span className="telos-card__badge">Setup</span>}
          </button>
        ))}
      </div>

      {/* Selected File Preview */}
      {selected && (
        <div className="telos-preview">
          <div className="telos-preview__header">
            <span>{selected.icon} {selected.name}</span>
            <button 
              className="telos-preview__close"
              onClick={() => setSelectedFile(null)}
            >
              ✕
            </button>
          </div>
          <div className="telos-preview__content">
            {selected.populated 
              ? <pre>{selected.content}</pre>
              : <p className="telos-preview__empty">
                  Not configured yet. Edit <code>USER/TELOS/{selected.name}.md</code> to set up.
                </p>
            }
          </div>
        </div>
      )}
    </div>
  );
}
