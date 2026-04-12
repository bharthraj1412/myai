'use client';

import React, { useState, useEffect } from 'react';

/**
 * MemoryDashboard — Overview of the MEMORY system.
 * Shows recent learnings, rating trends, and work history.
 */

interface RatingEntry {
  timestamp: string;
  rating: number;
  type: string;
}

interface LearningEntry {
  category: string;
  timestamp: string;
  title: string;
}

interface WorkItem {
  slug: string;
  task: string;
  phase: string;
  effort: string;
  progress: string;
}

export default function MemoryDashboard() {
  const [ratings, setRatings] = useState<RatingEntry[]>([]);
  const [learnings, setLearnings] = useState<LearningEntry[]>([]);
  const [workHistory, setWorkHistory] = useState<WorkItem[]>([]);
  const [ratingAvg, setRatingAvg] = useState<number | null>(null);

  useEffect(() => {
    fetchMemoryData();
    const interval = setInterval(fetchMemoryData, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchMemoryData() {
    try {
      const [ratingsRes, learningsRes, workRes] = await Promise.allSettled([
        fetch('/api/memory/ratings'),
        fetch('/api/memory/learnings'),
        fetch('/api/memory/work-history'),
      ]);

      if (ratingsRes.status === 'fulfilled' && ratingsRes.value.ok) {
        const data = await ratingsRes.value.json();
        setRatings(data.ratings || []);
        setRatingAvg(data.average);
      }

      if (learningsRes.status === 'fulfilled' && learningsRes.value.ok) {
        const data = await learningsRes.value.json();
        setLearnings(data.learnings || []);
      }

      if (workRes.status === 'fulfilled' && workRes.value.ok) {
        const data = await workRes.value.json();
        setWorkHistory(data.items || []);
      }
    } catch {
      // Silent failure
    }
  }

  return (
    <div className="memory-dashboard">
      <h3 className="memory-dashboard__title">🧠 Memory System</h3>
      
      {/* Rating Trend */}
      <div className="memory-card">
        <div className="memory-card__header">
          <span className="memory-card__icon">📊</span>
          <span className="memory-card__label">Rating Trend</span>
          {ratingAvg !== null && (
            <span className={`memory-card__badge ${ratingAvg >= 7 ? 'memory-card__badge--good' : 'memory-card__badge--warn'}`}>
              {ratingAvg}/10 avg
            </span>
          )}
        </div>
        {ratings.length > 0 ? (
          <div className="memory-card__ratings">
            {ratings.slice(-10).map((r, i) => (
              <div key={i} className="rating-dot" title={`${r.rating}/10 — ${r.timestamp}`}>
                <div 
                  className="rating-dot__fill" 
                  style={{ 
                    height: `${r.rating * 10}%`,
                    backgroundColor: r.rating >= 7 ? '#22C55E' : r.rating >= 4 ? '#F59E0B' : '#EF4444'
                  }} 
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="memory-card__empty">No ratings yet. Rate responses 1-10 to start tracking.</p>
        )}
      </div>

      {/* Recent Learnings */}
      <div className="memory-card">
        <div className="memory-card__header">
          <span className="memory-card__icon">📚</span>
          <span className="memory-card__label">Recent Learnings</span>
          <span className="memory-card__count">{learnings.length}</span>
        </div>
        {learnings.length > 0 ? (
          <ul className="memory-card__list">
            {learnings.slice(0, 5).map((l, i) => (
              <li key={i} className="memory-card__list-item">
                <span className={`memory-tag memory-tag--${l.category.toLowerCase()}`}>
                  {l.category}
                </span>
                <span className="memory-card__list-text">{l.title}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="memory-card__empty">No learnings captured yet.</p>
        )}
      </div>

      {/* Work History */}
      <div className="memory-card">
        <div className="memory-card__header">
          <span className="memory-card__icon">📂</span>
          <span className="memory-card__label">Work History</span>
          <span className="memory-card__count">{workHistory.length}</span>
        </div>
        {workHistory.length > 0 ? (
          <ul className="memory-card__list">
            {workHistory.slice(0, 5).map((w, i) => (
              <li key={i} className="memory-card__list-item">
                <span className={`memory-tag memory-tag--${w.phase}`}>
                  {w.phase}
                </span>
                <span className="memory-card__list-text">{w.task}</span>
                <span className="memory-card__list-meta">{w.progress}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="memory-card__empty">No work history yet.</p>
        )}
      </div>
    </div>
  );
}
