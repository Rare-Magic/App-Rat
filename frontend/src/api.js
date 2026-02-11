// Prefer explicit VITE_API_URL in dev; fall back to same-origin for packaged exe
const API_BASE = import.meta.env.VITE_API_URL || window.location.origin

export function getDownloadPptUrl() {
  return `${API_BASE}/api/download/ppt`
}

export function getDownloadExcelUrl() {
  return `${API_BASE}/api/download/excel`
}

export async function downloadFile(url, filename) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(res.statusText || 'Download failed')
  const blob = await res.blob()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename || 'download'
  a.click()
  URL.revokeObjectURL(a.href)
}

export async function uploadFile(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: form,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || res.statusText)
  return data
}

export async function mapCmdb() {
  const res = await fetch(`${API_BASE}/api/map-cmdb`, { method: 'POST' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || res.statusText)
  return data
}

export async function mapGartner() {
  const res = await fetch(`${API_BASE}/api/map-gartner`, { method: 'POST' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || res.statusText)
  return data
}
