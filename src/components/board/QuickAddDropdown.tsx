import { IconX } from '@tabler/icons-react'

import { Pill } from '@/components/ui/pill'
import { cn } from '@/lib/utils'

export function BadgeChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <Pill>
      {label}
      <button
        type="button"
        onClick={onClear}
        className="opacity-50 hover:opacity-100"
        aria-label="Modifica"
      >
        <IconX className="size-3" />
      </button>
    </Pill>
  )
}

export function Dropdown({ children }: { children: React.ReactNode }) {
  return (
    <div className="popover-surface absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border p-1 shadow-md">
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
