import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function MultiSelectFilter({
  label,
  options = [],
  selectedValues = [],
  allLabel,
  selectedPluralLabel,
  onChange,
  onClear
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const triggerRef = useRef(null)
  const panelId = useId()
  const selectedSet = new Set(selectedValues)
  const selectedLabels = options
    .filter(option => selectedSet.has(option.value))
    .map(option => option.label)
  const summary = getSelectionSummary(
    selectedLabels,
    allLabel,
    selectedPluralLabel
  )

  useEffect(() => {
    if (!open) {
      return undefined
    }

    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  function handleKeyDown(event) {
    if (event.key !== 'Escape' || !open) {
      return
    }

    event.preventDefault()
    setOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <div
      ref={containerRef}
      className="relative min-w-0"
      onKeyDown={handleKeyDown}
    >
      <div className="mb-2 text-sm font-bold text-slate-700">
        {label}
      </div>

      <button
        ref={triggerRef}
        type="button"
        aria-label={`${label}: ${summary}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(current => !current)}
        className="flex min-h-12 w-full min-w-0 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-left font-bold text-slate-800 outline-none hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <span className="min-w-0 break-words">{summary}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-5 w-5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute left-0 top-full z-30 mt-2 max-h-[min(24rem,60dvh)] w-full min-w-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
        >
          <div className="space-y-1" role="group" aria-label={label}>
            {options.map(option => (
              <label
                key={option.value}
                className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-50 focus-within:bg-emerald-50"
              >
                <input
                  type="checkbox"
                  checked={selectedSet.has(option.value)}
                  onChange={event => onChange?.(
                    option.value,
                    event.target.checked
                  )}
                  className="h-5 w-5 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="min-w-0 break-words font-bold text-slate-700">
                  {option.label}
                </span>
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={onClear}
            disabled={selectedValues.length === 0}
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3 font-bold text-slate-700 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            Auswahl leeren
          </button>
        </div>
      )}
    </div>
  )
}

function getSelectionSummary(labels, allLabel, selectedPluralLabel) {
  if (labels.length === 0) {
    return allLabel
  }

  if (labels.length <= 2) {
    return labels.join(', ')
  }

  return `${labels.length} ${selectedPluralLabel} ausgewählt`
}
