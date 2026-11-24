import bundledMenu from '../data/menu-fallback.json' with { type: 'json' }

/**
 * Only enable the customer-only static menu after a complete real catalog has
 * been placed in menu-fallback.json. Empty/partial placeholders never hide the
 * current Supabase flow while the fallback is being prepared.
 */
export function isUsableLocalMenu(snapshot) {
  const categories = Array.isArray(snapshot?.categories) ? snapshot.categories : []
  const items = Array.isArray(snapshot?.items) ? snapshot.items : []
  const categoryIds = new Set(categories.map((category) => category?.id))
  const imagesAreSafe = items.every((item) =>
    item?.image_url == null || item.image_url.startsWith('/menu-images/')
  )
  return Boolean(
    snapshot &&
      snapshot.complete === true &&
      snapshot.settings &&
      categories.length > 0 &&
      items.length > 0 &&
      categories.every((category) => category?.id && category?.name_ar) &&
      items.every((item) =>
        item &&
        item.id &&
        categoryIds.has(item.category_id) &&
        item.name_ar &&
        item.price !== null &&
        item.price !== undefined &&
        Number.isFinite(Number(item.price))
      ) &&
      (snapshot.displayImages === false || (snapshot.displayImages === true && imagesAreSafe))
  )
}

export function getBundledMenuSnapshot() {
  return isUsableLocalMenu(bundledMenu) ? bundledMenu : null
}
