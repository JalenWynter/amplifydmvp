import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      // Payouts & General
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'In-Transit': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      
      // Applications
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Pending Review': return 'bg-yellow-100 text-yellow-800';
      
      // Users
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Suspended': return 'bg-yellow-100 text-yellow-800';
      case 'Banned': return 'bg-red-100 text-red-800';

      // Submissions
      case 'Reviewed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';

      // Referrals
      case 'Used': return 'bg-blue-100 text-blue-800';
      case 'Expired': return 'bg-muted text-muted-foreground';


      default: return 'bg-muted text-muted-foreground';
    }
  }


export { Badge, badgeVariants, getStatusBadgeVariant }
