import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as FileSystem from 'expo-file-system/legacy';
import { ChecklistItem, Category } from '../types';
import { getDefaultItems } from '../data/checklist';
import { asyncStorage, STORAGE_KEY } from '../utils/storage';

interface ReportState {
  // Checklist
  items: ChecklistItem[];
  // Metadata
  technician: string;
  hospital: string;
  machineId: string;
  // Per-category photo URIs (kept for backward compat)
  imagePaths: Record<string, string>;
  // Per-item photo URIs
  itemImagePaths: Record<number, string>;
  // Setup flow
  isSetupComplete: boolean;

  // Actions
  updateItem: (id: number, patch: Partial<Pick<ChecklistItem, 'status' | 'note'>>) => void;
  updateMeta: (patch: Partial<Pick<ReportState, 'technician' | 'hospital' | 'machineId'>>) => void;
  setImagePath: (category: Category, uri: string) => void;
  setItemImagePath: (id: number, uri: string) => void;
  completeSetup: () => void;
  reset: () => void;
}

export const useReport = create<ReportState>()(
  persist(
    (set, get) => ({
      items: getDefaultItems(),
      technician: 'עמנואל גוטמן',
      hospital: '',
      machineId: '',
      imagePaths: {},
      itemImagePaths: {},
      isSetupComplete: false,

      updateItem: (id, patch) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...patch } : item
          ),
        })),

      updateMeta: (patch) => set(patch),

      setImagePath: (category, uri) =>
        set((state) => ({
          imagePaths: { ...state.imagePaths, [category]: uri },
        })),

      setItemImagePath: (id, uri) =>
        set((state) => ({
          itemImagePaths: { ...state.itemImagePaths, [id]: uri },
        })),

      completeSetup: () => set({ isSetupComplete: true }),

      reset: () => {
        Object.values(get().itemImagePaths).forEach((uri) => {
          FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
        });
        set({
          items: getDefaultItems(),
          imagePaths: {},
          itemImagePaths: {},
          isSetupComplete: false,
        });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: asyncStorage,
    }
  )
);
