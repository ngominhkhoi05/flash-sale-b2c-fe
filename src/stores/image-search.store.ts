import { create } from "zustand";
import type { ImageSearchResult } from "@/features/search/types";

interface ImageSearchState {
  imagePreviewUrl: string | null;
  result: ImageSearchResult | null;
  isLoading: boolean;
  error: string | null;

  setImagePreviewUrl: (url: string | null) => void;
  setResult: (result: ImageSearchResult | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

export const useImageSearchStore = create<ImageSearchState>((set) => ({
  imagePreviewUrl: null,
  result: null,
  isLoading: false,
  error: null,

  setImagePreviewUrl: (url) => set({ imagePreviewUrl: url }),
  setResult: (result) => set({ result, isLoading: false, error: null }),
  setLoading: (isLoading) => set({ isLoading, error: null }),
  setError: (error) => set({ error, isLoading: false }),
  clear: () => set({ imagePreviewUrl: null, result: null, isLoading: false, error: null }),
}));
