/** Batch bursty row-level events into one menu refresh. */
export function createMenuRefreshBatcher(listener, delay = 500) {
  let timer = null

  const schedule = () => {
    listener.invalidate?.(true)
    clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      listener.refresh({ force: true })
    }, delay)
  }

  schedule.cancel = () => {
    clearTimeout(timer)
    timer = null
  }

  return schedule
}
