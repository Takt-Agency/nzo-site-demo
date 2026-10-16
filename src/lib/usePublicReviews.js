import { useEffect, useState } from 'react'
import { publicApi } from './api.js'

// Rule: the public site only ever shows ratings computed from REAL reviews
// (client feedback approved in Admin > Avis). No hardcoded "4.9/5" or
// invented counts — with zero approved reviews the UI shows "reviews soon".

// Master switch for everything review-related on the public site: the
// "Avis clients" link (navbar + footer), the rating in the hero and in the
// final CTA. Off for now — flip to true once real client reviews exist.
export const REVIEWS_ENABLED = false

export function getReviewStats(list) {
  const total = list.length
  if (total === 0) return { average: 0, total: 0 }
  const sum = list.reduce((acc, r) => acc + (Number(r.rating) || 0), 0)
  return { average: sum / total, total }
}

// One request per page load, shared by Hero, FinalCTA and the reviews page.
let pending = null
function loadReviews() {
  if (!pending) {
    pending = publicApi
      .listReviews()
      .then((res) => (Array.isArray(res?.items) ? res.items : []))
      .catch(() => {
        pending = null // allow a retry on the next mount
        return []
      })
  }
  return pending
}

// Returns { loading, reviews, stats }. While loading, consumers should render
// nothing rating-related rather than a placeholder number.
export function usePublicReviews() {
  const [reviews, setReviews] = useState(REVIEWS_ENABLED ? null : [])

  useEffect(() => {
    if (!REVIEWS_ENABLED) return undefined
    let cancelled = false
    loadReviews().then((items) => {
      if (!cancelled) setReviews(items)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const list = reviews || []
  return { loading: reviews === null, reviews: list, stats: getReviewStats(list) }
}
