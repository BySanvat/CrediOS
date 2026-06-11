import { CircleDashed } from "lucide-react";
import { Card, CardContent } from "./card";

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <CircleDashed className="h-10 w-10 text-muted" />
        <h3 className="mt-4 text-base font-semibold">{title}</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted">{text}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
