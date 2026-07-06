import { create } from 'zustand'
import { datasetsApi } from '@/lib/api'

export interface Dataset {
  id: string
  name: string
  original_name: string
  rows: number
  columns: number
  column_names: string[]
  dtypes: Record<string, string>
  preview: object[]
  missing_total: number
  duplicate_rows: number
  created_at: string
  is_merged?: boolean
}

interface DatasetState {
  datasets: Dataset[]
  activeDataset: Dataset | null
  isLoading: boolean
  error: string | null
  fetchDatasets: () => Promise<void>
  uploadDataset: (file: File, name?: string) => Promise<Dataset>
  deleteDataset: (id: string) => Promise<void>
  setActiveDataset: (dataset: Dataset | null) => void
  mergeDatasets: (ids: string[], mergeOn?: string) => Promise<Dataset>
}

export const useDatasetStore = create<DatasetState>((set, get) => ({
  datasets: [],
  activeDataset: null,
  isLoading: false,
  error: null,

  fetchDatasets: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await datasetsApi.list()
      set({ datasets: data })
    } catch (e: any) {
      set({ error: e.message })
    } finally {
      set({ isLoading: false })
    }
  },

  uploadDataset: async (file, name) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await datasetsApi.upload(file, name)
      set((s) => ({ datasets: [data, ...s.datasets] }))
      return data
    } catch (e: any) {
      set({ error: e.response?.data?.detail || e.message })
      throw e
    } finally {
      set({ isLoading: false })
    }
  },

  deleteDataset: async (id) => {
    await datasetsApi.delete(id)
    set((s) => ({
      datasets: s.datasets.filter((d) => d.id !== id),
      activeDataset: s.activeDataset?.id === id ? null : s.activeDataset,
    }))
  },

  setActiveDataset: (dataset) => set({ activeDataset: dataset }),

  mergeDatasets: async (ids, mergeOn) => {
    set({ isLoading: true })
    try {
      const { data } = await datasetsApi.merge(ids, mergeOn)
      set((s) => ({ datasets: [data, ...s.datasets] }))
      return data
    } finally {
      set({ isLoading: false })
    }
  },
}))
