/**
 * AG3NT Hook System — Identity Module
 * 
 * Reads identity and principal configuration from settings.json.
 * Provides convenience functions for accessing DA and user identity.
 * 
 * Adapted from PAI's hooks/lib/identity.ts
 */

import { loadSettings } from './hook-io';

interface DAIdentity {
  name: string;
  fullName: string;
  displayName: string;
  color: string;
  voiceId: string;
  personality: {
    humor: number;
    precision: number;
    directness: number;
    warmth: number;
    autonomy: number;
  };
}

interface Principal {
  name: string;
  pronunciation: string;
  timezone: string;
  temperatureUnit: string;
}

let _cachedSettings: any = null;

function getSettings(): any {
  if (!_cachedSettings) {
    _cachedSettings = loadSettings();
  }
  return _cachedSettings;
}

/**
 * Get the DA (Digital Assistant) identity.
 */
export function getIdentity(): DAIdentity {
  const settings = getSettings();
  return settings.daidentity || {
    name: 'AG3NT',
    fullName: 'AG3NT Personal AI Agent',
    displayName: 'AG3NT',
    color: '#3B82F6',
    voiceId: '',
    personality: { humor: 40, precision: 85, directness: 75, warmth: 60, autonomy: 70 }
  };
}

/**
 * Get the principal (user) identity.
 */
export function getPrincipal(): Principal {
  const settings = getSettings();
  return settings.principal || {
    name: 'User',
    pronunciation: 'User',
    timezone: 'UTC',
    temperatureUnit: 'celsius'
  };
}

/** Get DA display name */
export function getDAName(): string { return getIdentity().displayName; }

/** Get principal name */
export function getPrincipalName(): string { return getPrincipal().name; }

/** Get DA voice ID */
export function getVoiceId(): string { return getIdentity().voiceId; }

/** Get DA color */
export function getDAColor(): string { return getIdentity().color; }

/** Get timezone */
export function getTimezone(): string { return getPrincipal().timezone; }
