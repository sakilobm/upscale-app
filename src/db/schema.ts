/**
 * Drizzle ORM schema targeting Supabase / PostgreSQL.
 * Apply via `supabase db push` or `drizzle-kit push`.
 */
import {
  pgTable,
  uuid,
  text,
  numeric,
  integer,
  boolean,
  timestamp,
  date,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Budgets ──────────────────────────────────────────────────────────────────

export const budgets = pgTable(
  'budgets',
  {
    id:        uuid('id').defaultRandom().primaryKey(),
    userId:    uuid('user_id').notNull(),
    category:  text('category').notNull(),
    period:    text('period', { enum: ['weekly', 'monthly', 'yearly'] }).notNull().default('monthly'),
    limitAmt:  numeric('limit_amt', { precision: 14, scale: 2 }).notNull(),
    spent:     numeric('spent',     { precision: 14, scale: 2 }).notNull().default('0'),
    color:     text('color').notNull().default('#6C63FF'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index('budgets_user_idx').on(t.userId),
  })
);

// ─── Planned Payments ─────────────────────────────────────────────────────────

export const plannedPayments = pgTable(
  'planned_payments',
  {
    id:                uuid('id').defaultRandom().primaryKey(),
    userId:            uuid('user_id').notNull(),
    title:             text('title').notNull(),
    amount:            numeric('amount', { precision: 14, scale: 2 }).notNull(),
    dueDate:           date('due_date').notNull(),
    category:          text('category').notNull(),
    status:            text('status', { enum: ['UPCOMING', 'OVERDUE', 'SETTLED'] }).notNull().default('UPCOMING'),
    isRecurring:       boolean('is_recurring').notNull().default(false),
    recurringInterval: text('recurring_interval', { enum: ['weekly', 'monthly', 'yearly'] }),
    settledAt:         timestamp('settled_at', { withTimezone: true }),
    createdAt:         timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt:         timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index('planned_payments_user_idx').on(t.userId),
    dueDateIdx: index('planned_payments_due_date_idx').on(t.dueDate),
  })
);

// ─── Loans & Debts ────────────────────────────────────────────────────────────

export const loansAndDebts = pgTable(
  'loans_and_debts',
  {
    id:                 uuid('id').defaultRandom().primaryKey(),
    userId:             uuid('user_id').notNull(),
    name:               text('name').notNull(),
    counterparty:       text('counterparty').notNull(),
    type:               text('type', { enum: ['BORROWED', 'LENT'] }).notNull(),
    principalAmount:    numeric('principal_amount',    { precision: 14, scale: 2 }).notNull(),
    amountPaid:         numeric('amount_paid',         { precision: 14, scale: 2 }).notNull().default('0'),
    interestRate:       numeric('interest_rate',       { precision: 6,  scale: 3 }),
    startDate:          date('start_date').notNull(),
    nextPaymentDate:    date('next_payment_date'),
    emiAmount:          numeric('emi_amount',          { precision: 14, scale: 2 }),
    totalPayments:      integer('total_payments'),
    completedPayments:  integer('completed_payments').notNull().default(0),
    color:              text('color').notNull().default('#6C63FF'),
    createdAt:          timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt:          timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx:        index('loans_user_idx').on(t.userId),
    nextPaymentIdx: index('loans_next_payment_idx').on(t.nextPaymentDate),
  })
);

// ─── Hand-to-Hand Ledger ──────────────────────────────────────────────────────

export const handToHandLedger = pgTable(
  'hand_to_hand_ledger',
  {
    id:              uuid('id').defaultRandom().primaryKey(),
    userId:          uuid('user_id').notNull(),
    personName:      text('person_name').notNull(),
    personPhone:     text('person_phone'),
    personAvatarUrl: text('person_avatar_url'),
    direction:       text('direction', { enum: ['OWED_TO_ME', 'I_OWE'] }).notNull(),
    totalAmount:     numeric('total_amount',    { precision: 14, scale: 2 }).notNull(),
    amountReturned:  numeric('amount_returned', { precision: 14, scale: 2 }).notNull().default('0'),
    currency:        text('currency').notNull().default('USD'),
    date:            date('date').notNull(),
    dueDate:         date('due_date'),
    note:            text('note'),
    status:          text('status', { enum: ['ACTIVE', 'SETTLED', 'OVERDUE'] }).notNull().default('ACTIVE'),
    createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt:       timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx:      index('ledger_user_idx').on(t.userId),
    directionIdx: index('ledger_direction_idx').on(t.direction),
    statusIdx:    index('ledger_status_idx').on(t.status),
  })
);

// ─── Ledger Partial Returns ───────────────────────────────────────────────────

export const ledgerPartialReturns = pgTable(
  'ledger_partial_returns',
  {
    id:             uuid('id').defaultRandom().primaryKey(),
    ledgerEntryId:  uuid('ledger_entry_id')
      .notNull()
      .references(() => handToHandLedger.id, { onDelete: 'cascade' }),
    amount:    numeric('amount', { precision: 14, scale: 2 }).notNull(),
    date:      date('date').notNull(),
    note:      text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    ledgerEntryIdx: index('partial_returns_ledger_idx').on(t.ledgerEntryId),
  })
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const handToHandLedgerRelations = relations(handToHandLedger, ({ many }) => ({
  partialReturns: many(ledgerPartialReturns),
}));

export const ledgerPartialReturnsRelations = relations(ledgerPartialReturns, ({ one }) => ({
  ledgerEntry: one(handToHandLedger, {
    fields:     [ledgerPartialReturns.ledgerEntryId],
    references: [handToHandLedger.id],
  }),
}));

// ─── TypeScript type exports ──────────────────────────────────────────────────

export type Budget              = typeof budgets.$inferSelect;
export type NewBudget           = typeof budgets.$inferInsert;
export type PlannedPayment      = typeof plannedPayments.$inferSelect;
export type NewPlannedPayment   = typeof plannedPayments.$inferInsert;
export type LoanDebt            = typeof loansAndDebts.$inferSelect;
export type NewLoanDebt         = typeof loansAndDebts.$inferInsert;
export type LedgerEntry         = typeof handToHandLedger.$inferSelect;
export type NewLedgerEntry      = typeof handToHandLedger.$inferInsert;
export type PartialReturn       = typeof ledgerPartialReturns.$inferSelect;
export type NewPartialReturn    = typeof ledgerPartialReturns.$inferInsert;
