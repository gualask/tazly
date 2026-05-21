export const TAG_COLORS = [
  'red',
  'orange',
  'amber',
  'green',
  'teal',
  'blue',
  'indigo',
  'purple',
  'pink',
  'slate',
] as const

export type TagColor = (typeof TAG_COLORS)[number]

interface ColorClasses {
  bg: string
  fg: string
  border: string
}

export const TAG_COLOR_CLASSES: Record<TagColor, ColorClasses> = {
  red: {
    bg: 'bg-red-100 dark:bg-white/[0.06]',
    fg: 'text-red-800 dark:text-red-300',
    border: 'border-red-200 dark:border-white/10',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-white/[0.06]',
    fg: 'text-orange-800 dark:text-orange-300',
    border: 'border-orange-200 dark:border-white/10',
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-white/[0.06]',
    fg: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-200 dark:border-white/10',
  },
  green: {
    bg: 'bg-green-100 dark:bg-white/[0.06]',
    fg: 'text-green-800 dark:text-green-300',
    border: 'border-green-200 dark:border-white/10',
  },
  teal: {
    bg: 'bg-teal-100 dark:bg-white/[0.06]',
    fg: 'text-teal-800 dark:text-teal-300',
    border: 'border-teal-200 dark:border-white/10',
  },
  blue: {
    bg: 'bg-blue-100 dark:bg-white/[0.06]',
    fg: 'text-blue-800 dark:text-blue-300',
    border: 'border-blue-200 dark:border-white/10',
  },
  indigo: {
    bg: 'bg-indigo-100 dark:bg-white/[0.06]',
    fg: 'text-indigo-800 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-white/10',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-white/[0.06]',
    fg: 'text-purple-800 dark:text-purple-300',
    border: 'border-purple-200 dark:border-white/10',
  },
  pink: {
    bg: 'bg-pink-100 dark:bg-white/[0.06]',
    fg: 'text-pink-800 dark:text-pink-300',
    border: 'border-pink-200 dark:border-white/10',
  },
  slate: {
    bg: 'bg-slate-100 dark:bg-white/[0.06]',
    fg: 'text-slate-800 dark:text-slate-400',
    border: 'border-slate-200 dark:border-white/10',
  },
}
