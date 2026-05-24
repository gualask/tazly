import { IconArrowRight } from '@tabler/icons-react'

import { TagBadge } from '@/components/tags/TagBadge'
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
  if (suggestion.kind === 'create-project') {
    return (
      <>
        <span className="font-mono text-muted-foreground">+</span>
        <span className="text-muted-foreground">crea progetto</span>
        <span className="font-medium">"{suggestion.name}"</span>
      </>
    )
  }
  if (suggestion.kind === 'tag') {
    return (
      <>
        <span className="font-mono text-muted-foreground">#</span>
        <TagBadge tag={suggestion.tag} />
      </>
    )
  }
  return (
    <>
      <span className="font-mono text-muted-foreground">›</span>
      <span>{suggestion.category.name}</span>
    </>
  )
}
