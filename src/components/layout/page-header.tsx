import { AppIcon, type IconName } from "@/components/ui/app-icon";

export function PageHeader({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: IconName;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 soft-enter sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-3">
          {icon ? (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-warm text-accent">
              <AppIcon name={icon} className="h-5 w-5" />
            </span>
          ) : null}
          <h1 className="min-w-0 text-2xl font-semibold tracking-normal sm:text-4xl">{title}</h1>
        </div>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-muted sm:text-base">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
