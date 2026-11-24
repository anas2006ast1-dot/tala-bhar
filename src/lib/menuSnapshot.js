/** Create the customer fallback file from a fresh admin data snapshot. */
export function createMenuFallbackSnapshot({ categories, items, settings }) {
  if (!Array.isArray(categories) || !categories.length) {
    throw new Error('لا توجد أقسام حديثة لتصديرها.')
  }
  if (!Array.isArray(items) || !items.length || !settings) {
    throw new Error('بيانات القائمة أو إعدادات المطعم غير مكتملة.')
  }

  return {
    version: 1,
    complete: true,
    displayImages: false,
    categories,
    items,
    settings,
  }
}
