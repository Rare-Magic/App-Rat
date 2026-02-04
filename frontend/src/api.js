const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

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
