import { useEffect, useState, useCallback, useRef } from 'react'

// Hook for one-shot data fetching with loading + error state.
// Pass a stable `fetcher` function (use useCallback). Return:
//   { data, loading, error, reload }
export function useApi(fetcher, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const counter = useRef(0)

  const run = useCallback(async () => {
    const seq = ++counter.current
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      if (seq === counter.current) setData(result)
    } catch (err) {
      if (seq === counter.current) setError(err)
    } finally {
      if (seq === counter.current) setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    run()
  }, [run])

  return { data, loading, error, reload: run }
}
