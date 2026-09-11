import { useCallback, useSyncExternalStore } from 'react';
import type { Protocol } from './api';

// 简单的检测配置草稿存储：首页验证连通性后，把 base_url/api_key 带给检测页继续完整流程。
export interface DetectDraft {
  base_url: string;
  api_key: string;
  protocol?: Protocol;
}

const STORAGE_KEY = 'zgo-doctor.detectDraft';
let cache: DetectDraft | null = null;
const listeners = new Set<() => void>();

function read(): DetectDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DetectDraft) : null;
  } catch {
    return null;
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function emit() {
  listeners.forEach((cb) => cb());
}

export function useSession() {
  const draft = useSyncExternalStore(subscribe, () => cache ?? read());

  const setDraft = useCallback((draft: DetectDraft | null) => {
    cache = draft;
    if (draft) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      } catch {
        /* ignore */
      }
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
    emit();
  }, []);

  const clearDraft = useCallback(() => setDraft(null), [setDraft]);

  return { draft, setDraft, clearDraft };
}
