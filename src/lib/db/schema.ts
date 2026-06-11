import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    ownerId: uuid("owner_id").notNull(),
    defaultCurrency: text("default_currency").default("COP").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [index("workspaces_owner_idx").on(table.ownerId)],
);

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull(),
    userId: uuid("user_id").notNull(),
    role: text("role").default("owner").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("workspace_members_workspace_idx").on(table.workspaceId),
    index("workspace_members_user_idx").on(table.userId),
  ],
);

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull(),
    fullName: text("full_name").notNull(),
    documentId: text("document_id"),
    phone: text("phone"),
    email: text("email"),
    address: text("address"),
    notes: text("notes"),
    status: text("status").default("active").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    index("clients_workspace_idx").on(table.workspaceId),
    index("clients_status_idx").on(table.workspaceId, table.status),
  ],
);

export const simulations = pgTable(
  "simulations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull(),
    ownerId: uuid("owner_id").notNull(),
    name: text("name").notNull(),
    productType: text("product_type").default("fixed_installment_credit").notNull(),
    principalCents: bigint("principal_cents", { mode: "number" }).notNull(),
    rateValue: text("rate_value").notNull(),
    rateType: text("rate_type").notNull(),
    termMonths: integer("term_months").notNull(),
    startDate: date("start_date").notNull(),
    monthlyFeeCents: bigint("monthly_fee_cents", { mode: "number" }).default(0).notNull(),
    monthlyInsuranceCents: bigint("monthly_insurance_cents", { mode: "number" }).default(0).notNull(),
    upfrontFeeCents: bigint("upfront_fee_cents", { mode: "number" }).default(0).notNull(),
    notes: text("notes"),
    summary: jsonb("summary").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    index("simulations_workspace_idx").on(table.workspaceId),
    index("simulations_owner_idx").on(table.ownerId),
    index("simulations_created_idx").on(table.workspaceId, table.createdAt),
  ],
);

export const creditAccounts = pgTable(
  "credit_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull(),
    clientId: uuid("client_id"),
    ownerId: uuid("owner_id").notNull(),
    sourceSimulationId: uuid("source_simulation_id"),
    name: text("name").notNull(),
    type: text("type").default("fixed_installment_credit").notNull(),
    status: text("status").default("active").notNull(),
    principalCents: bigint("principal_cents", { mode: "number" }).notNull(),
    currentBalanceCents: bigint("current_balance_cents", { mode: "number" }).notNull(),
    rateValue: text("rate_value").notNull(),
    rateType: text("rate_type").notNull(),
    termMonths: integer("term_months").notNull(),
    startDate: date("start_date").notNull(),
    monthlyFeeCents: bigint("monthly_fee_cents", { mode: "number" }).default(0).notNull(),
    monthlyInsuranceCents: bigint("monthly_insurance_cents", { mode: "number" }).default(0).notNull(),
    summary: jsonb("summary").notNull(),
    notes: text("notes"),
    isPersonal: boolean("is_personal").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    index("credit_accounts_workspace_idx").on(table.workspaceId),
    index("credit_accounts_client_idx").on(table.clientId),
    index("credit_accounts_status_idx").on(table.workspaceId, table.status),
  ],
);

export const installments = pgTable(
  "installments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull(),
    creditAccountId: uuid("credit_account_id").notNull(),
    installmentNumber: integer("installment_number").notNull(),
    dueDate: date("due_date").notNull(),
    principalCents: bigint("principal_cents", { mode: "number" }).notNull(),
    interestCents: bigint("interest_cents", { mode: "number" }).notNull(),
    feesCents: bigint("fees_cents", { mode: "number" }).default(0).notNull(),
    totalCents: bigint("total_cents", { mode: "number" }).notNull(),
    remainingBalanceCents: bigint("remaining_balance_cents", { mode: "number" }).notNull(),
    status: text("status").default("pending").notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("installments_workspace_due_idx").on(table.workspaceId, table.dueDate),
    index("installments_credit_idx").on(table.creditAccountId),
    index("installments_status_idx").on(table.workspaceId, table.status),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull(),
    creditAccountId: uuid("credit_account_id").notNull(),
    installmentId: uuid("installment_id"),
    amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
    principalCents: bigint("principal_cents", { mode: "number" }).default(0).notNull(),
    interestCents: bigint("interest_cents", { mode: "number" }).default(0).notNull(),
    feesCents: bigint("fees_cents", { mode: "number" }).default(0).notNull(),
    paymentDate: date("payment_date").notNull(),
    method: text("method"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid("created_by").notNull(),
  },
  (table) => [
    index("payments_workspace_date_idx").on(table.workspaceId, table.paymentDate),
    index("payments_credit_idx").on(table.creditAccountId),
    index("payments_installment_idx").on(table.installmentId),
  ],
);

export const extraPayments = pgTable(
  "extra_payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull(),
    creditAccountId: uuid("credit_account_id").notNull(),
    amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
    paymentDate: date("payment_date").notNull(),
    strategy: text("strategy").notNull(),
    previousSummary: jsonb("previous_summary"),
    newSummary: jsonb("new_summary"),
    interestSavingsCents: bigint("interest_savings_cents", { mode: "number" }).default(0).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid("created_by").notNull(),
  },
  (table) => [
    index("extra_payments_workspace_idx").on(table.workspaceId),
    index("extra_payments_credit_idx").on(table.creditAccountId),
  ],
);

export const reminders = pgTable(
  "reminders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull(),
    creditAccountId: uuid("credit_account_id"),
    clientId: uuid("client_id"),
    title: text("title").notNull(),
    dueDate: date("due_date").notNull(),
    status: text("status").default("pending").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("reminders_workspace_due_idx").on(table.workspaceId, table.dueDate),
    index("reminders_status_idx").on(table.workspaceId, table.status),
  ],
);

export const creditCards = pgTable(
  "credit_cards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull(),
    ownerId: uuid("owner_id").notNull(),
    name: text("name").notNull(),
    issuer: text("issuer"),
    limitCents: bigint("limit_cents", { mode: "number" }).default(0).notNull(),
    usedBalanceCents: bigint("used_balance_cents", { mode: "number" }).default(0).notNull(),
    monthlyRate: text("monthly_rate").default("0").notNull(),
    cutDay: integer("cut_day").default(1).notNull(),
    paymentDueDay: integer("payment_due_day").default(15).notNull(),
    status: text("status").default("active").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("credit_cards_workspace_idx").on(table.workspaceId)],
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull(),
    actorId: uuid("actor_id").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    action: text("action").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_events_workspace_idx").on(table.workspaceId, table.createdAt),
    index("audit_events_entity_idx").on(table.workspaceId, table.entityType, table.entityId),
  ],
);
