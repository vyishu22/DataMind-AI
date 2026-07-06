import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''

// Warn in console if API URL is not configured (helps debug Vercel deployments)
if (!API_URL) {
  console.error(
    '[DataMind AI] VITE_API_URL is not set. ' +
    'Add it in Vercel → Settings → Environment Variables. ' +
    'Value should be your Render backend URL e.g. https://datamind-api.onrender.com'
  )
}

export const api = axios.create({
  baseURL: API_URL || 'http://localhost:8000',
  timeout: 60_000,
})

// ── Request: attach access token ───────────────────────────────────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token') || localStorage.getItem('dm_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response: auto-refresh on 401 ─────────────────────────────────────────────
let _refreshing: Promise<string> | null = null

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken =
        localStorage.getItem('refresh_token') || localStorage.getItem('dm_refresh_token')

      if (refreshToken) {
        // Deduplicate concurrent refresh calls
        if (!_refreshing) {
          _refreshing = axios
            .post(`${API_URL}/api/auth/refresh`, { refresh_token: refreshToken })
            .then(({ data }) => {
              localStorage.setItem('access_token',  data.access_token)
              localStorage.setItem('dm_access_token', data.access_token)
              if (data.refresh_token) {
                localStorage.setItem('refresh_token',   data.refresh_token)
                localStorage.setItem('dm_refresh_token', data.refresh_token)
              }
              return data.access_token
            })
            .catch(() => {
              // Hard logout
              ['access_token','refresh_token','dm_access_token','dm_refresh_token'].forEach(k =>
                localStorage.removeItem(k))
              window.location.href = '/auth/login'
              return Promise.reject('Session expired')
            })
            .finally(() => { _refreshing = null })
        }

        try {
          const newToken = await _refreshing
          original.headers.Authorization = `Bearer ${newToken}`
          return api(original)
        } catch {
          return Promise.reject(err)
        }
      }
    }
    return Promise.reject(err)
  },
)

// ── Convenience API objects (kept for backward compat) ─────────────────────────
export const authApi = {
  register: (d: { name: string; email: string; password: string }) =>
    api.post('/api/auth/register', { fullName: d.name, ...d }),
  login:    (d: { email: string; password: string }) =>
    api.post('/api/auth/login', d),
  me:       () => api.get('/api/auth/me'),
}

export const datasetsApi = {
  upload: (file: File, name?: string) => {
    const form = new FormData()
    form.append('file', file)
    if (name) form.append('name', name)
    return api.post('/api/datasets/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  list:   ()      => api.get('/api/datasets/'),
  get:    (id: string) => api.get(`/api/datasets/${id}`),
  delete: (id: string) => api.delete(`/api/datasets/${id}`),
  merge:  (ids: string[], mergeOn?: string) =>
    api.post('/api/datasets/merge', ids, { params: mergeOn ? { merge_on: mergeOn } : undefined }),
}

export const analysisApi = {
  eda:              (id: string)                               => api.get(`/api/analysis/${id}/eda`),
  health:           (id: string)                               => api.get(`/api/analysis/${id}/health`),
  cleaning:         (id: string)                               => api.get(`/api/analysis/${id}/cleaning`),
  chartData:        (id: string, p: Record<string, string>)    => api.get(`/api/analysis/${id}/chart-data`, { params: p }),
  correlationMatrix:(id: string)                               => api.get(`/api/analysis/${id}/correlation-matrix`),
  applyClean:       (id: string, actions: object[])            => api.post(`/api/analysis/${id}/clean`, actions),
}

export const chatApi = {
  send:         (datasetId: string, message: string, sessionId?: string) =>
    api.post('/api/chat/message', { dataset_id: datasetId, message, session_id: sessionId }),
  history:      (datasetId: string) => api.get(`/api/chat/history/${datasetId}`),
  clearHistory: (datasetId: string) => api.delete(`/api/chat/history/${datasetId}`),
  sessions:     ()                  => api.get('/api/chat/sessions'),
  insights:     (datasetId: string) => api.post(`/api/chat/insights/${datasetId}`),
}

export const reportsApi = {
  generate: (datasetId: string, opts?: object) =>
    api.post('/api/reports/generate', { dataset_id: datasetId, ...opts }, { timeout: 180_000 }),
  list:     ()            => api.get('/api/reports/'),
  download: (id: string)  => api.get(`/api/reports/download/${id}`, { responseType: 'blob' }),
  delete:   (id: string)  => api.delete(`/api/reports/${id}`),
}

export const forecastApi = {
  predict: (payload: object)     => api.post('/api/forecast/predict', payload),
  columns: (datasetId: string)   => api.get(`/api/forecast/columns/${datasetId}`),
}
