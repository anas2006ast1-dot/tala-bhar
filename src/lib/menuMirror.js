export async function fetchMenuSnapshotFromMedia(mediaApiUrl, fetchImpl = fetch) {
  if (!mediaApiUrl) throw new Error('خدمة القائمة غير مضبوطة.')
  const response = await fetchImpl(`${mediaApiUrl.replace(/\/$/, '')}/menu`, { cache: 'no-store' })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || `تعذّر تحميل نسخة القائمة (${response.status}).`)
  }
  const snapshot = await response.json()
  if (!Array.isArray(snapshot.categories) || !Array.isArray(snapshot.items)) {
    throw new Error('استجابة نسخة القائمة غير صالحة.')
  }
  return { categories: snapshot.categories, items: snapshot.items, settings: snapshot.settings || null }
}
