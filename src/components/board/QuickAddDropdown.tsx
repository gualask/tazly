import { IconX } from '@tabler/icons-react'

import { cn } from '@/lib/utils'

export function BadgeChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-secondary-foreground text-xs">
      {label}
      <button
        type="button"
        onClick={onClear}
        className="opacity-50 hover:opacity-100"
        aria-label="Modifica"
      >
        <IconX className="size-3" />
      </button>
    </span>
  )
}

export function Dropdown({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md backdrop-blur-xl">
      {children}
    </div>
  )
}

export function DropdownItem({
  active,
  onClick,
  onMouseEnter,
  children,
}: {
  active: boolean
  onClick: () => void
  onMouseEnter: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        'flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm',
        active && 'bg-accent text-accent-foreground',
      )}
    >
      {children}
    </button>
  )
}
