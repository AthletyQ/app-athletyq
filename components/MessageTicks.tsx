// WhatsApp-style message status ticks
// sent      → single grey tick   (in transit / optimistic)
// delivered → double grey tick   (saved to DB, is_read = false)
// read      → double blue tick   (is_read = true)

interface MessageTicksProps {
  status: 'sent' | 'delivered' | 'read'
  className?: string
}

export function MessageTicks({ status, className = '' }: MessageTicksProps) {
  if (status === 'sent') {
    // Single grey tick
    return (
      <svg
        className={`inline-block ${className}`}
        width="16" height="11"
        viewBox="0 0 16 11"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1 5.5L5.5 10L15 1"
          stroke="#9CA3AF"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (status === 'delivered') {
    // Double grey tick
    return (
      <svg
        className={`inline-block ${className}`}
        width="20" height="11"
        viewBox="0 0 20 11"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* First tick */}
        <path
          d="M1 5.5L5.5 10L15 1"
          stroke="#9CA3AF"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Second tick (offset right) */}
        <path
          d="M6 5.5L10.5 10L20 1"
          stroke="#9CA3AF"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  // read → double blue tick
  return (
    <svg
      className={`inline-block ${className}`}
      width="20" height="11"
      viewBox="0 0 20 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 5.5L5.5 10L15 1"
        stroke="#3B82F6"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 5.5L10.5 10L20 1"
        stroke="#3B82F6"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}