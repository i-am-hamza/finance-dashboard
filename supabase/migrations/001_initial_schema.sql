-- ============================================================
-- Finance Dashboard — Initial Schema Migration
-- Run once in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================


-- ----------------------------------------------------------------
-- 0. SHARED TRIGGER FUNCTION: stamp updated_at on every UPDATE
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ================================================================
-- TABLE 1: user_settings
-- One row per user. Seeded by the app on first sign-up.
-- ================================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  base_currency text        NOT NULL DEFAULT 'INR',
  display_name  text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT user_settings_user_id_key UNIQUE (user_id)
);

CREATE TRIGGER trg_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "delete_own" ON public.user_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id
  ON public.user_settings (user_id);


-- ================================================================
-- TABLE 2: exchange_rates
-- User-managed rates. 1 unit of currency_code = rate_to_base units
-- of the user's base currency. Updated manually; stale after 30 days.
-- ================================================================
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency_code text          NOT NULL,
  rate_to_base  numeric(18,6) NOT NULL CHECK (rate_to_base > 0),
  last_updated  timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT exchange_rates_user_currency_key UNIQUE (user_id, currency_code)
);

-- RLS
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON public.exchange_rates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own" ON public.exchange_rates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own" ON public.exchange_rates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "delete_own" ON public.exchange_rates
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exchange_rates_user_id
  ON public.exchange_rates (user_id);


-- ================================================================
-- TABLE 3: cash_accounts
-- Bank accounts, wallets, FDs, cash-in-hand. Balance is kept
-- in sync by the app each time a transaction is recorded.
-- ================================================================
CREATE TABLE IF NOT EXISTS public.cash_accounts (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             text          NOT NULL,
  account_type     text          NOT NULL
                     CHECK (account_type IN (
                       'Savings', 'Current', 'FixedDeposit', 'Wallet', 'Cash'
                     )),
  balance          numeric(18,2) NOT NULL DEFAULT 0,
  currency         text          NOT NULL DEFAULT 'INR',
  rate_at_entry    numeric(18,6) NOT NULL DEFAULT 1
                     CHECK (rate_at_entry > 0),
  bank_name        text,
  notes            text,
  -- Fixed-deposit extras (NULL for non-FD accounts)
  fd_maturity_date date,
  fd_interest_rate numeric(6,3)  CHECK (fd_interest_rate >= 0),
  created_at       timestamptz   NOT NULL DEFAULT now(),
  updated_at       timestamptz   NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_cash_accounts_updated_at
  BEFORE UPDATE ON public.cash_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.cash_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON public.cash_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own" ON public.cash_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own" ON public.cash_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "delete_own" ON public.cash_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cash_accounts_user_id
  ON public.cash_accounts (user_id);


-- ================================================================
-- TABLE 4: cash_transactions
-- Individual credits/debits within a cash_account.
-- Deleting the parent account cascades to its transactions.
-- ================================================================
CREATE TABLE IF NOT EXISTS public.cash_transactions (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id       uuid          NOT NULL REFERENCES public.cash_accounts(id) ON DELETE CASCADE,
  transaction_type text          NOT NULL
                     CHECK (transaction_type IN ('Credit', 'Debit')),
  amount           numeric(18,2) NOT NULL CHECK (amount > 0),
  currency         text          NOT NULL DEFAULT 'INR',
  rate_at_entry    numeric(18,6) NOT NULL DEFAULT 1
                     CHECK (rate_at_entry > 0),
  date             date          NOT NULL,
  category         text
                     CHECK (category IN (
                       'SalaryReceived', 'EMIPaid', 'Transfer', 'Other'
                     )),
  note             text,
  created_at       timestamptz   NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON public.cash_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own" ON public.cash_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own" ON public.cash_transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "delete_own" ON public.cash_transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cash_transactions_user_id
  ON public.cash_transactions (user_id);

CREATE INDEX IF NOT EXISTS idx_cash_transactions_account_id
  ON public.cash_transactions (account_id);

-- Time-series queries (monthly summaries, history charts)
CREATE INDEX IF NOT EXISTS idx_cash_transactions_user_date
  ON public.cash_transactions (user_id, date DESC);


-- ================================================================
-- TABLE 5: income
-- Income log entries. Each entry is a discrete income event.
-- ================================================================
CREATE TABLE IF NOT EXISTS public.income (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_name   text          NOT NULL,
  amount        numeric(18,2) NOT NULL CHECK (amount > 0),
  currency      text          NOT NULL DEFAULT 'INR',
  rate_at_entry numeric(18,6) NOT NULL DEFAULT 1
                  CHECK (rate_at_entry > 0),
  date          date          NOT NULL,
  category      text
                  CHECK (category IN (
                    'Salary', 'Freelance', 'Rental', 'Dividend', 'Business', 'Other'
                  )),
  notes         text,
  created_at    timestamptz   NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON public.income
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own" ON public.income
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own" ON public.income
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "delete_own" ON public.income
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_income_user_id
  ON public.income (user_id);

CREATE INDEX IF NOT EXISTS idx_income_user_date
  ON public.income (user_id, date DESC);


-- ================================================================
-- TABLE 6: loans
-- One row per loan. outstanding is kept in sync by the app
-- whenever an EMI payment is recorded.
-- ================================================================
CREATE TABLE IF NOT EXISTS public.loans (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lender        text          NOT NULL,
  loan_type     text          NOT NULL
                  CHECK (loan_type IN (
                    'Home', 'Car', 'Personal', 'Education', 'CreditCard', 'Other'
                  )),
  principal     numeric(18,2) NOT NULL CHECK (principal > 0),
  outstanding   numeric(18,2) NOT NULL CHECK (outstanding >= 0),
  interest_rate numeric(6,3)  NOT NULL CHECK (interest_rate >= 0),
  emi_amount    numeric(18,2) NOT NULL CHECK (emi_amount > 0),
  currency      text          NOT NULL DEFAULT 'INR',
  rate_at_entry numeric(18,6) NOT NULL DEFAULT 1
                  CHECK (rate_at_entry > 0),
  -- day-of-month the EMI falls due (1–31)
  due_day       smallint      NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  start_date    date          NOT NULL,
  end_date      date          NOT NULL,
  status        text          NOT NULL DEFAULT 'Active'
                  CHECK (status IN ('Active', 'Closed', 'Paused')),
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT loans_dates_check CHECK (end_date > start_date)
);

CREATE TRIGGER trg_loans_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON public.loans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own" ON public.loans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own" ON public.loans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "delete_own" ON public.loans
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_loans_user_id
  ON public.loans (user_id);

-- Filter active/closed loans efficiently
CREATE INDEX IF NOT EXISTS idx_loans_user_status
  ON public.loans (user_id, status);


-- ================================================================
-- TABLE 7: emi_payments
-- One row per monthly EMI payment event. Inserting a row triggers
-- the app to: (a) update loans.outstanding, (b) create a
-- read-only budget_expenses entry (source='emi').
-- Deleting the parent loan cascades to its payment history.
-- ================================================================
CREATE TABLE IF NOT EXISTS public.emi_payments (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  loan_id             uuid          NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  payment_date        date          NOT NULL,
  amount_paid         numeric(18,2) NOT NULL CHECK (amount_paid > 0),
  currency            text          NOT NULL DEFAULT 'INR',
  rate_at_entry       numeric(18,6) NOT NULL DEFAULT 1
                        CHECK (rate_at_entry > 0),
  -- Optional split; if NULL the app estimates via amortisation formula
  principal_component numeric(18,2) CHECK (principal_component >= 0),
  interest_component  numeric(18,2) CHECK (interest_component >= 0),
  -- outstanding balance on the loan after this payment
  outstanding_after   numeric(18,2) NOT NULL CHECK (outstanding_after >= 0),
  created_at          timestamptz   NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.emi_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON public.emi_payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own" ON public.emi_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own" ON public.emi_payments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "delete_own" ON public.emi_payments
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_emi_payments_user_id
  ON public.emi_payments (user_id);

CREATE INDEX IF NOT EXISTS idx_emi_payments_loan_id
  ON public.emi_payments (loan_id);

CREATE INDEX IF NOT EXISTS idx_emi_payments_user_date
  ON public.emi_payments (user_id, payment_date DESC);


-- ================================================================
-- TABLE 8: budget_categories
-- Monthly budget envelope per category. Unique per user+month+category.
-- month format: 'YYYY-MM' (enforced by CHECK).
-- ================================================================
CREATE TABLE IF NOT EXISTS public.budget_categories (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 'YYYY-MM' format, e.g. '2026-06'
  month           text          NOT NULL
                    CHECK (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  category        text          NOT NULL,
  budgeted_amount numeric(18,2) NOT NULL CHECK (budgeted_amount >= 0),
  currency        text          NOT NULL DEFAULT 'INR',
  rate_at_entry   numeric(18,6) NOT NULL DEFAULT 1
                    CHECK (rate_at_entry > 0),
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT budget_categories_user_month_category_key
    UNIQUE (user_id, month, category)
);

CREATE TRIGGER trg_budget_categories_updated_at
  BEFORE UPDATE ON public.budget_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON public.budget_categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own" ON public.budget_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own" ON public.budget_categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "delete_own" ON public.budget_categories
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_budget_categories_user_id
  ON public.budget_categories (user_id);

CREATE INDEX IF NOT EXISTS idx_budget_categories_user_month
  ON public.budget_categories (user_id, month);


-- ================================================================
-- TABLE 9: subscriptions
-- Recurring service subscriptions. On next_renewal_date the app
-- auto-creates a budget_expenses row (source='subscription') and
-- advances next_renewal_date by the billing cycle.
-- ================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_name      text          NOT NULL,
  amount            numeric(18,2) NOT NULL CHECK (amount > 0),
  currency          text          NOT NULL DEFAULT 'INR',
  rate_at_entry     numeric(18,6) NOT NULL DEFAULT 1
                      CHECK (rate_at_entry > 0),
  billing_cycle     text          NOT NULL
                      CHECK (billing_cycle IN (
                        'Weekly', 'Monthly', 'Quarterly', 'Yearly'
                      )),
  next_renewal_date date          NOT NULL,
  category          text
                      CHECK (category IN (
                        'Streaming', 'SaaS', 'Finance', 'Utilities', 'Health', 'Other'
                      )),
  status            text          NOT NULL DEFAULT 'Active'
                      CHECK (status IN ('Active', 'Paused', 'Cancelled')),
  notes             text,
  created_at        timestamptz   NOT NULL DEFAULT now(),
  updated_at        timestamptz   NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "delete_own" ON public.subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON public.subscriptions (user_id);

-- Active-subscription totals and renewal-alert queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
  ON public.subscriptions (user_id, status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_renewal
  ON public.subscriptions (user_id, next_renewal_date);


-- ================================================================
-- TABLE 10: budget_expenses
-- Unified expense ledger. Three sources:
--   'manual'       — user-entered directly in the Budget UI
--   'emi'          — auto-created when an EMI payment is recorded
--   'subscription' — auto-created on subscription renewal
--
-- Auto entries (is_auto = true) are read-only from the user's
-- perspective; the RLS UPDATE/DELETE policies enforce this at the
-- database level. Only the service role (server actions) may
-- modify or delete auto entries.
--
-- source_id is a soft reference to emi_payments.id or
-- subscriptions.id depending on source value. No hard FK because
-- it can point to two different tables.
-- ================================================================
CREATE TABLE IF NOT EXISTS public.budget_expenses (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date          date          NOT NULL,
  amount        numeric(18,2) NOT NULL CHECK (amount > 0),
  currency      text          NOT NULL DEFAULT 'INR',
  rate_at_entry numeric(18,6) NOT NULL DEFAULT 1
                  CHECK (rate_at_entry > 0),
  category      text          NOT NULL,
  note          text,
  source        text          NOT NULL DEFAULT 'manual'
                  CHECK (source IN ('manual', 'emi', 'subscription')),
  -- UUID of the emi_payments or subscriptions row that created this entry
  source_id     uuid,
  is_auto       boolean       NOT NULL DEFAULT false,
  created_at    timestamptz   NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.budget_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON public.budget_expenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own" ON public.budget_expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only UPDATE their own manually-entered expenses
CREATE POLICY "update_own_manual" ON public.budget_expenses
  FOR UPDATE USING (auth.uid() = user_id AND is_auto = false);

-- Users can only DELETE their own manually-entered expenses
CREATE POLICY "delete_own_manual" ON public.budget_expenses
  FOR DELETE USING (auth.uid() = user_id AND is_auto = false);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_budget_expenses_user_id
  ON public.budget_expenses (user_id);

-- Monthly budget-vs-actual aggregation
CREATE INDEX IF NOT EXISTS idx_budget_expenses_user_date
  ON public.budget_expenses (user_id, date DESC);

-- Finding / deleting the auto entry when its source is removed
CREATE INDEX IF NOT EXISTS idx_budget_expenses_source_id
  ON public.budget_expenses (source_id)
  WHERE source_id IS NOT NULL;


-- ================================================================
-- TABLE 11: investments
-- Manual snapshot tracker. Users periodically re-import from
-- INDmoney via CSV. current_price is updated manually; staleness
-- is detected when price_updated_at > 7 days ago.
-- ================================================================
CREATE TABLE IF NOT EXISTS public.investments (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_name       text          NOT NULL,
  asset_type       text          NOT NULL
                     CHECK (asset_type IN (
                       'Stocks', 'MutualFund', 'FD', 'Crypto',
                       'RealEstate', 'Gold', 'Other'
                     )),
  -- buy_price / current_price stored with 6 decimal places to handle
  -- fractional units (e.g. crypto, mutual fund NAV)
  buy_price        numeric(18,6) NOT NULL CHECK (buy_price > 0),
  current_price    numeric(18,6) NOT NULL CHECK (current_price >= 0),
  quantity         numeric(18,6) NOT NULL CHECK (quantity > 0),
  currency         text          NOT NULL DEFAULT 'INR',
  buy_date         date          NOT NULL,
  -- Stamped whenever current_price is edited; used for stale-price UI
  price_updated_at timestamptz   NOT NULL DEFAULT now(),
  created_at       timestamptz   NOT NULL DEFAULT now(),
  updated_at       timestamptz   NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_investments_updated_at
  BEFORE UPDATE ON public.investments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON public.investments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own" ON public.investments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own" ON public.investments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "delete_own" ON public.investments
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_investments_user_id
  ON public.investments (user_id);

-- Stale-price detection: find holdings where price_updated_at < now() - 7 days
CREATE INDEX IF NOT EXISTS idx_investments_user_price_age
  ON public.investments (user_id, price_updated_at);


-- ================================================================
-- DONE
-- All 11 tables created with RLS and indexes.
-- Verify with:
--   SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
--   SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;
-- ================================================================
