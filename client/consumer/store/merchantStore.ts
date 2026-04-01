import { create } from 'zustand';
import type { Merchant } from '../types';

interface MerchantState {
  merchants: Merchant[];
  selected: Merchant | null;
  loading: boolean;
  error: string | null;
  setMerchants: (m: Merchant[]) => void;
  selectMerchant: (m: Merchant) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
}

export const useMerchantStore = create<MerchantState>((set) => ({
  merchants: [],
  selected: null,
  loading: false,
  error: null,
  setMerchants: (merchants) => set({ merchants }),
  selectMerchant: (selected) => set({ selected }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
