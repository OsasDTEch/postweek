/**
 * Brand — canonical PostWeek logomark + wordmark.
 *
 * Usage:
 *   <Brand />                     — default (dark ink / cobalt, for light bg)
 *   <Brand variant="light" />     — white + cobalt, for dark bg panels
 *   <Brand size="lg" />           — larger size
 */

interface BrandProps {
  /** "dark" = ink text on light bg (default). "light" = white text on dark bg. */
  variant?: "dark" | "light";
  /** "sm" = navbar size. "lg" = auth panel size. */
  size?: "sm" | "lg";
}

export default function Brand({ variant = "dark", size = "sm" }: BrandProps) {
  const isLight = variant === "light";
  const isLg    = size === "lg";

  const postColor  = isLight ? "text-white"              : "text-ink dark:text-[#F1F3F6]";
  const weekColor  = isLight ? "text-cobalt-400"         : "text-cobalt-500 dark:text-cobalt-400";
  const postSize   = isLg    ? "text-[1.25rem]"          : "text-[1.0625rem]";
  const weekSize   = isLg    ? "text-[1.0625rem]"        : "text-[0.875rem]";
  const markSize   = isLg    ? "h-8 w-8"                 : "h-7 w-7";
  const iconSize   = isLg    ? "h-5 w-5"                 : "h-4 w-4";

  return (
    <span className="flex items-center gap-2 leading-none select-none">
      {/* Square logomark */}
      <span className={`${markSize} flex items-center justify-center rounded-md bg-cobalt-500 shrink-0`}>
        <svg viewBox="0 0 20 20" fill="none" className={iconSize} aria-hidden="true">
          <path d="M5 4h5.5C12.4 4 14 5.6 14 7.5S12.4 11 10.5 11H7v5H5V4z" fill="white"/>
          <path d="M7 6v3h3.5c.83 0 1.5-.67 1.5-1.5S11.33 6 10.5 6H7z" fill="#2E5BFF"/>
        </svg>
      </span>
      {/* Wordmark */}
      <span className="leading-none">
        <span
          className={`${postSize} font-normal tracking-tight ${postColor}`}
          style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic" }}
        >
          Post
        </span>
        <span className={`font-mono ${weekSize} font-semibold tracking-tight ${weekColor}`}>
          Week
        </span>
      </span>
    </span>
  );
}
