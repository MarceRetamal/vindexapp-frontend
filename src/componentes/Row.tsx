import { Link } from 'react-router'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export function Row({
  index,
  to,
  children,
  actions,
}: {
  index: number
  to: string
  children: ReactNode
  actions?: ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-wrap items-center gap-x-4 gap-y-3 py-4 border-b border-line group transition-colors hover:bg-white/[0.02]"
    >
      <span className="font-mono text-xs text-silver-deep border border-line rounded-sharp w-8 h-8 flex items-center justify-center shrink-0 group-hover:border-silver transition-colors">
        {String(index).padStart(2, '0')}
      </span>
      <Link to={to} className="flex-1 min-w-0 basis-40 flex flex-col gap-0.5 focus-visible:outline-none">
        {children}
      </Link>
      {actions && <div className="flex flex-wrap items-center gap-2 w-full pl-12 lg:w-auto lg:pl-0 lg:justify-end">{actions}</div>}
    </motion.div>
  )
}
