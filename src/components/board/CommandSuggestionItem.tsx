import { IconArrowRight } from '@tabler/icons-react'

import type { Suggestion } from '@/lib/commandSuggestions'

export function SuggestionContent({ suggestion }: { suggestion: Suggestion }) {
  if (suggestion.kind === 'project') {
    return (
      <>
        <IconArrowRight className="size-3.5 text-muted-foreground" />
        <span className="font-medium">{suggestion.name}</span>
        <span className="text-muted-foreground text-xs tabular-nums">
          {suggestion.openCount} apert{suggestion.openCount === 1 ? 'o' : 'i'}
        </span>
      </>
    )
  }
  return (
    <>
      <span className="font-mono text-muted-foreground">+</span>
      <span className="text-muted-foreground">crea progetto</span>
      <span className="font-medium">"{suggestion.name}"</span>
    </>
  )
}
