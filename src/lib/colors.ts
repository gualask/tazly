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
  dot: string
}

export const TAG_COLOR_CLASSES: Record<TagColor, ColorClasses> = {
  red: {
    bg: 'bg-red-100 dark:bg-red-950/40',
    fg: 'text-red-800 dark:text-red-200',
    border: 'border-red-200 dark:border-red-900',
    dot: 'bg-red-500',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-950/40',
    fg: 'text-orange-800 dark:text-orange-200',
    border: 'border-orange-200 dark:border-orange-900',
    dot: 'bg-orange-500',
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-950/40',
    fg: 'text-amber-800 dark:text-amber-200',
    border: 'border-amber-200 dark:border-amber-900',
    dot: 'bg-amber-500',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-950/40',
    fg: 'text-green-800 dark:text-green-200',
    border: 'border-green-200 dark:border-green-900',
    dot: 'bg-green-500',
  },
  teal: {
    bg: 'bg-teal-100 dark:bg-teal-950/40',
    fg: 'text-teal-800 dark:text-teal-200',
    border: 'border-teal-200 dark:border-teal-900',
    dot: 'bg-teal-500',
  },
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-950/40',
    fg: 'text-blue-800 dark:text-blue-200',
    border: 'border-blue-200 dark:border-blue-900',
    dot: 'bg-blue-500',
  },
  indigo: {
    bg: 'bg-indigo-100 dark:bg-indigo-950/40',
    fg: 'text-indigo-800 dark:text-indigo-200',
    border: 'border-indigo-200 dark:border-indigo-900',
    dot: 'bg-indigo-500',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-950/40',
    fg: 'text-purple-800 dark:text-purple-200',
    border: 'border-purple-200 dark:border-purple-900',
    dot: 'bg-purple-500',
  },
  pink: {
    bg: 'bg-pink-100 dark:bg-pink-950/40',
    fg: 'text-pink-800 dark:text-pink-200',
    border: 'border-pink-200 dark:border-pink-900',
    dot: 'bg-pink-500',
  },
  slate: {
    bg: 'bg-slate-100 dark:bg-slate-800/60',
    fg: 'text-slate-800 dark:text-slate-200',
    border: 'border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-500',
  },
}
