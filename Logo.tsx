/** NOXÉRA monogram: an angular N cut by a champagne-gold slash. */
export function Monogram({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="noxg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E9D7A5" />
          <stop offset=".5" stopColor="#C6A66A" />
          <stop offset="1" stopColor="#8a6d3b" />
        </linearGradient>
      </defs>
      <path fill="url(#noxg)" d="M8 56V14h11l26 29V14h11v42H45L19 27v29z" />
      <path fill="url(#noxg)" d="M24 24 62 3 41 29z" opacity=".92" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return <span className={`font-display font-medium tracking-[0.35em] gold-text ${className}`}>NOXÉRA</span>;
}

export default function Logo({ size = "h-8 w-8" }: { size?: string }) {
  return (
    <span className="inline-flex items-center gap-3">
      <Monogram className={size} />
      <Wordmark className="text-xl" />
    </span>
  );
}
