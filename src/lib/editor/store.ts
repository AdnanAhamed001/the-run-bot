import { create } from "zustand";
import { temporal } from "zundo";
import type { TemporalState } from "zundo";
import { useStore } from "zustand";

export interface ElementEdit {
  text?: string;
  hidden?: boolean;
  style?: Record<string, string>;
  src?: string; // image replacement
  translate?: { x: number; y: number };
  size?: { width?: number; height?: number };
  rotate?: number;
}

interface EditorState {
  edits: Record<string, ElementEdit>;
  selection: string[];
  zoom: number;
  snapToGrid: boolean;
  activePage: number;
  setEdit: (id: string, patch: Partial<ElementEdit>) => void;
  patchStyle: (id: string, style: Record<string, string>) => void;
  deleteElement: (id: string) => void;
  select: (ids: string[]) => void;
  setZoom: (z: number) => void;
  setSnap: (b: boolean) => void;
  setActivePage: (n: number) => void;
  reset: () => void;
  loadFromStorage: (key: string) => void;
  persist: (key: string) => void;
}

export const useEditorStore = create<EditorState>()(
  temporal(
    (set, get) => ({
      edits: {},
      selection: [],
      zoom: 0.4,
      snapToGrid: true,
      activePage: 0,
      setEdit: (id, patch) =>
        set((s) => ({
          edits: { ...s.edits, [id]: { ...s.edits[id], ...patch } },
        })),
      patchStyle: (id, style) =>
        set((s) => ({
          edits: {
            ...s.edits,
            [id]: {
              ...s.edits[id],
              style: { ...(s.edits[id]?.style ?? {}), ...style },
            },
          },
        })),
      deleteElement: (id) =>
        set((s) => ({
          edits: { ...s.edits, [id]: { ...s.edits[id], hidden: true } },
          selection: s.selection.filter((x) => x !== id),
        })),
      select: (ids) => set({ selection: ids }),
      setZoom: (z) => set({ zoom: Math.max(0.1, Math.min(2, z)) }),
      setSnap: (b) => set({ snapToGrid: b }),
      setActivePage: (n) => set({ activePage: n }),
      reset: () => set({ edits: {}, selection: [] }),
      loadFromStorage: (key) => {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.edits) set({ edits: parsed.edits });
          }
        } catch {
          /* ignore */
        }
      },
      persist: (key) => {
        try {
          localStorage.setItem(key, JSON.stringify({ edits: get().edits }));
        } catch {
          /* ignore */
        }
      },
    }),
    {
      partialize: (s) => ({ edits: s.edits }) as Partial<EditorState>,
      limit: 100,
    },
  ),
);

export const useTemporalStore = <T,>(
  selector: (state: TemporalState<Partial<EditorState>>) => T,
) => useStore(useEditorStore.temporal, selector);
