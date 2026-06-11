export default function AppLoading() {
  return (
    <div className="grid gap-5">
      <div className="h-24 animate-pulse rounded-[1.5rem] border border-border bg-card" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-32 animate-pulse rounded-[1.5rem] border border-border bg-card" />
        <div className="h-32 animate-pulse rounded-[1.5rem] border border-border bg-card" />
        <div className="h-32 animate-pulse rounded-[1.5rem] border border-border bg-card" />
      </div>
      <div className="h-72 animate-pulse rounded-[1.5rem] border border-border bg-card" />
    </div>
  );
}
