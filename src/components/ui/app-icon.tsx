import { cn } from "@/lib/utils/cn";

export type IconName =
  | "dashboard"
  | "wallet"
  | "swap"
  | "target"
  | "chart"
  | "calculator"
  | "file"
  | "users"
  | "credit"
  | "bell"
  | "settings"
  | "plus"
  | "payment"
  | "down"
  | "menu"
  | "close"
  | "briefcase"
  | "home"
  | "palette"
  | "google"
  | "spinner";

const paths: Record<Exclude<IconName, "spinner">, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7h15a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h13" />
      <path d="M16 13h5" />
      <circle cx="17" cy="13" r="1" />
    </>
  ),
  swap: (
    <>
      <path d="M7 7h12l-3-3" />
      <path d="M17 17H5l3 3" />
      <path d="M19 7l-3 3" />
      <path d="M5 17l3-3" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 15l3-4 3 2 4-6" />
    </>
  ),
  calculator: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="3" />
      <path d="M8 7h8" />
      <path d="M8 11h2M12 11h2M16 11h.01M8 15h2M12 15h2M16 15h.01" />
    </>
  ),
  file: (
    <>
      <path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M14 3v6h5" />
      <path d="M8 13h8M8 17h5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 11a3 3 0 0 0 0-6" />
      <path d="M17 20a5 5 0 0 0-3-4.6" />
    </>
  ),
  credit: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M3 10h18" />
      <path d="M7 15h4" />
    </>
  ),
  bell: (
    <>
      <path d="M6 10a6 6 0 0 1 12 0c0 7 3 6 3 8H3c0-2 3-1 3-8Z" />
      <path d="M10 21h4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5l-.3 3.1a7 7 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .3 0 .7.1 1l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.3 3.1h5l.3-3.1a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  payment: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7v10M9 9.5c.7-.8 2-.9 3-.4 1 .5 1.7 1.6 0 2.4l-1.5.7c-1.8.8-1 2.3.1 2.7 1.1.4 2.5.2 3.1-.7" />
    </>
  ),
  down: <path d="M6 9l6 6 6-6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="3" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </>
  ),
  home: (
    <>
      <path d="M4 11 12 4l8 7" />
      <path d="M6 10v10h12V10" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3a9 9 0 0 0 0 18h1.5a2 2 0 0 0 1.5-3.3 1.7 1.7 0 0 1 1.3-2.8H18a6 6 0 0 0 0-12Z" />
      <circle cx="7.5" cy="10" r=".7" />
      <circle cx="10" cy="7.5" r=".7" />
      <circle cx="13.5" cy="7.5" r=".7" />
      <circle cx="16" cy="10" r=".7" />
    </>
  ),
  google: (
    <>
      <path d="M20.5 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9a8.7 8.7 0 0 0 2.6-6.6Z" />
      <path d="M12 21a8.5 8.5 0 0 0 5.9-2.2L15 16.6a5.4 5.4 0 0 1-8-2.8H4v2.3A9 9 0 0 0 12 21Z" />
      <path d="M7 13.8a5.4 5.4 0 0 1 0-3.6V7.9H4a9 9 0 0 0 0 8.2Z" />
      <path d="M12 6.6c1.4 0 2.6.5 3.6 1.4l2.6-2.6A8.8 8.8 0 0 0 12 3a9 9 0 0 0-8 4.9l3 2.3a5.4 5.4 0 0 1 5-3.6Z" />
    </>
  ),
};

export function AppIcon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  if (name === "spinner") {
    return (
      <svg
        className={cn("h-4 w-4 animate-spin", className)}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-90" d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg
      className={cn("h-4 w-4", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
