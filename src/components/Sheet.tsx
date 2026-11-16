import type { ReactNode } from 'react'

type Props = {
  title: string
  onClose?: () => void
  children: ReactNode
}

/** 画面下から出るパネル。onClose がないときは閉じられない（くじの回し忘れ防止） */
export function Sheet({ title, onClose, children }: Props) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{title}</h2>
          {onClose && (
            <button className="sheet-close" onClick={onClose} aria-label="とじる">
              ×
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}
