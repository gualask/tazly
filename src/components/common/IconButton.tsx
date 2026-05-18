import { forwardRef } from 'react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type ButtonProps = React.ComponentProps<typeof Button>

interface IconButtonProps extends Omit<ButtonProps, 'title'> {
  tooltip: React.ReactNode
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left'
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ tooltip, tooltipSide = 'top', size = 'icon', variant = 'ghost', ...props }, ref) => {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button ref={ref} size={size} variant={variant} {...props} />
        </TooltipTrigger>
        <TooltipContent side={tooltipSide}>{tooltip}</TooltipContent>
      </Tooltip>
    )
  },
)
IconButton.displayName = 'IconButton'
