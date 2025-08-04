export function NorthernRailwayLogo({ className = "", size = 120 }: { className?: string; size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 120 120" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer circle */}
      <circle cx="60" cy="60" r="58" fill="#1e40af" stroke="#fbbf24" strokeWidth="4"/>
      
      {/* Inner design - Railway wheel */}
      <circle cx="60" cy="60" r="45" fill="none" stroke="#fbbf24" strokeWidth="2"/>
      <circle cx="60" cy="60" r="30" fill="none" stroke="#fbbf24" strokeWidth="2"/>
      <circle cx="60" cy="60" r="15" fill="#fbbf24"/>
      
      {/* Spokes */}
      <g stroke="#fbbf24" strokeWidth="3">
        <line x1="60" y1="15" x2="60" y2="45"/>
        <line x1="60" y1="75" x2="60" y2="105"/>
        <line x1="15" y1="60" x2="45" y2="60"/>
        <line x1="75" y1="60" x2="105" y2="60"/>
        <line x1="30.5" y1="30.5" x2="47" y2="47"/>
        <line x1="73" y1="73" x2="89.5" y2="89.5"/>
        <line x1="89.5" y1="30.5" x2="73" y2="47"/>
        <line x1="47" y1="73" x2="30.5" y2="89.5"/>
      </g>
      
      {/* Center text */}
      <text x="60" y="67" textAnchor="middle" fill="#1e40af" fontSize="16" fontWeight="bold">NR</text>
    </svg>
  );
}