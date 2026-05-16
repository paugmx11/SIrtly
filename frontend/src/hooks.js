import { useState, useMemo, useEffect } from 'react'

/**
 * Hook para manejar paginación de listas
 * @param {Array} items - Los items a paginar
 * @param {number} itemsPerPage - Cantidad de items por página (default: 7)
 * @returns {Object} { currentItems, currentPage, totalPages, goToPage, nextPage, prevPage, canGoNext, canGoPrev }
 */
export function usePagination(items = [], itemsPerPage = 7) {
  const [currentPage, setCurrentPage] = useState(1)

  // Reset currentPage to 1 when items change (e.g., when filtering/searching)
  useEffect(() => {
    setCurrentPage(1)
  }, [items.length])

  const { currentItems, totalPages } = useMemo(() => {
    const total = Math.ceil(items.length / itemsPerPage)
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    const current = items.slice(start, end)
    return {
      currentItems: current,
      totalPages: Math.max(1, total),
    }
  }, [items, itemsPerPage, currentPage])

  const goToPage = (page) => {
    const validPage = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(validPage)
  }

  const nextPage = () => {
    goToPage(currentPage + 1)
  }

  const prevPage = () => {
    goToPage(currentPage - 1)
  }

  const canGoNext = currentPage < totalPages
  const canGoPrev = currentPage > 1
  const showPagination = items.length > itemsPerPage

  return {
    currentItems,
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    canGoNext,
    canGoPrev,
    showPagination,
  }
}
