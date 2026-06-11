import { NextRequest } from "next/server";
import { getPeriodRange, periodFromSearchParam } from "@/domain/personal-finance";
import { createClient } from "@/lib/supabase/server";

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return new Response("Supabase no configurado", { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("No autenticado", { status: 401 });

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();
  if (membershipError || !membership) return new Response("Workspace no disponible", { status: 403 });

  const period = periodFromSearchParam(request.nextUrl.searchParams.get("period"));
  const range = getPeriodRange(period);
  const { data, error } = await supabase
    .from("personal_transactions")
    .select("occurred_at,type,amount_cents,currency,note_raw,personal_categories(name)")
    .eq("workspace_id", membership.workspace_id)
    .is("archived_at", null)
    .gte("occurred_at", range.start)
    .lte("occurred_at", range.end)
    .order("occurred_at", { ascending: true });

  if (error) return new Response("No se pudo exportar", { status: 500 });

  const rows = [
    ["fecha", "tipo", "monto_centavos", "moneda", "categoria", "nota"],
    ...(data ?? []).map((transaction) => {
      const category = Array.isArray(transaction.personal_categories)
        ? transaction.personal_categories[0]
        : transaction.personal_categories;
      return [
        transaction.occurred_at,
        transaction.type,
        transaction.amount_cents,
        transaction.currency,
        category?.name ?? "",
        transaction.note_raw,
      ];
    }),
  ];
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="credios-finanzas-${period}.csv"`,
    },
  });
}
