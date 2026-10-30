type LogoProps = {
  className?: string
}

export function LogoMark({ className = 'h-8 w-8' }: LogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 12.5V7h5.5M19.5 7H25v5.5M25 19.5V25h-5.5M12.5 25H7v-5.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="square"
      />
      <circle cx="16" cy="16" r="6.4" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="16" cy="16" r="2.5" fill="currentColor" />
    </svg>
  )
}

export default function Logo({ className = 'h-8 w-auto' }: LogoProps) {
  return (
    <svg
      viewBox="0 0 156 32"
      className={className}
      role="img"
      aria-label="Libview"
    >
      <g fill="none">
        <path
          d="M7 12.5V7h5.5M19.5 7H25v5.5M25 19.5V25h-5.5M12.5 25H7v-5.5"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="square"
        />
        <circle cx="16" cy="16" r="6.4" stroke="currentColor" strokeWidth="2.2" />
        <circle cx="16" cy="16" r="2.5" fill="currentColor" />
      </g>
      <text
        x="38"
        y="16"
        dominantBaseline="middle"
        fill="currentColor"
        fontFamily="Outfit, ui-sans-serif, system-ui, sans-serif"
        fontSize="20"
        fontWeight="600"
        letterSpacing="0.04em"
      >
        Libview
      </text>
    </svg>
  )
}
