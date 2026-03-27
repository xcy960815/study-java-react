import React from 'react'

interface InteractiveHoverButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string
  icon?: React.ReactNode
  overlayClassName?: string
}

export const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(({ text, icon, className = '', overlayClassName = '', disabled, ...props }, ref) => {
  const baseClassName = [
    'group relative inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-full border',
    'px-5 text-sm font-semibold tracking-[0.24em] uppercase transition-all duration-300',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c3ff5]/30',
    disabled
      ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
      : 'cursor-pointer border-slate-200 bg-white text-slate-800 shadow-[0_16px_40px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(108,63,245,0.18)]',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const overlayClasses = [
    'absolute inset-0 flex items-center justify-center gap-2 rounded-full',
    'transition-all duration-300',
    disabled
      ? 'opacity-0'
      : 'translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100',
    overlayClassName || 'bg-[#6c3ff5] text-white',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button ref={ref} className={baseClassName} disabled={disabled} {...props}>
      <span
        className={
          disabled
            ? 'transition-all duration-300'
            : 'transition-all duration-300 group-hover:-translate-y-8 group-hover:opacity-0'
        }
      >
        {text}
      </span>
      <span className={overlayClasses}>
        <span>{text}</span>
        {icon ?? (
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 12h14m-5-5 5 5-5 5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
        )}
      </span>
    </button>
  )
})

InteractiveHoverButton.displayName = 'InteractiveHoverButton'
