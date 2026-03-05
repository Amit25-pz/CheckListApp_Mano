import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

/** Key used by the Zustand persist middleware */
export const STORAGE_KEY = 'hyperbaric-report-v1';

/** Zustand-compatible storage adapter backed by AsyncStorage */
export const asyncStorage = createJSONStorage(() => AsyncStorage);
