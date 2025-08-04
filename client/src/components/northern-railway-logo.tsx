import nrLogo from "@assets/images_1754334137957.jpeg";

export function NorthernRailwayLogo({ className = "", size = 120 }: { className?: string; size?: number }) {
  return (
    <div 
      className={`flex items-center justify-center rounded-lg overflow-hidden bg-white ${className}`}
      style={{ width: size, height: size }}
    >
      <img 
        src={nrLogo} 
        alt="Northern Railway Logo" 
        className="w-full h-full object-contain"
        style={{ maxWidth: size, maxHeight: size }}
      />
    </div>
  );
}