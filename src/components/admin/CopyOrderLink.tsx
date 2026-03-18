'use client'

import React, { useCallback, useMemo, useState } from 'react'

export default function CopyOrderLink({ rowData }: { rowData: any }) {
  const [copied, setCopied] = useState(false)
  const id = rowData?.id ?? '';

  const href = useMemo(() => {
    if (!id) return ''
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/order/${id}`
  }, [id])

  const onCopy = useCallback(async () => {
    if (!href) return
    await navigator.clipboard.writeText(href)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }, [href])

  const disabled = !href

  return (
    <div>
      <button
        type="button"
        onClick={onCopy}
        disabled={disabled}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          height: 32,
          padding: '0 12px',
          borderRadius: 6,
          border: '1px solid var(--theme-elevation-150)',
          background: 'var(--theme-elevation-0)',
          color: 'var(--theme-text)',
          cursor: 'pointer',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {copied ? '已複製' : '複製連結'}
      </button>
    </div>
  )
}

