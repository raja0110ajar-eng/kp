'use client';

import { useSyncExternalStore, type ComponentType } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'kp:theme';

const OPTIONS: ReadonlyArray<{
  value: ThemePreference;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { value: 'light', label: 'Tema terang', icon: Sun },
  { value: 'dark', label: 'Tema gelap', icon: Moon },
  { value: 'system', label: 'Ikuti pengaturan perangkat', icon: Monitor },
];

const listeners = new Set<() => void>();

function readPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    return 'system';
  }
}

function applyTheme(preference: ThemePreference): void {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = preference === 'dark' || (preference === 'system' && prefersDark);
  const root = document.documentElement;
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const handleMedia = () => {
    if (readPreference() === 'system') applyTheme('system');
  };
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY) {
      applyTheme(readPreference());
      onChange();
    }
  };

  media.addEventListener('change', handleMedia);
  window.addEventListener('storage', handleStorage);
  return () => {
    listeners.delete(onChange);
    media.removeEventListener('change', handleMedia);
    window.removeEventListener('storage', handleStorage);
  };
}

/** size "lg" dipakai di menu akun pada layar sentuh (target 44 px). */
export function ThemeToggle({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  const preference = useSyncExternalStore(
    subscribe,
    readPreference,
    (): ThemePreference => 'system'
  );

  function choose(next: ThemePreference) {
    try {
      if (next === 'system') window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage diblokir: tema tetap berlaku selama tab terbuka.
    }
    applyTheme(next);
    listeners.forEach((notify) => notify());
  }

  const buttonSize = size === 'lg' ? 'h-11 w-11' : 'h-8 w-8';
  const iconSize = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  return (
    <div role="group" aria-label="Pilih tema" className="inline-flex rounded-full border border-line p-0.5">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = preference === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            aria-label={option.label}
            title={option.label}
            onClick={() => choose(option.value)}
            className={`flex ${buttonSize} items-center justify-center rounded-full transition-colors ${
              active ? 'bg-primary text-white' : 'text-muted hover:text-ink'
            }`}
          >
            <Icon className={iconSize} />
          </button>
        );
      })}
    </div>
  );
}