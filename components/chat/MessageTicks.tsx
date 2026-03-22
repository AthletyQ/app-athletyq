interface MessageTicksProps {
  status: 'sent' | 'delivered' | 'read'
  className?: string
}

export function MessageTicks({ status, className = '' }: MessageTicksProps) {
  if (status === 'sent') {
    
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
          stroke="#9CA3AF"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
       
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