-- Add rate_at_entry to investments (missed in initial schema)
ALTER TABLE public.investments
  ADD COLUMN IF NOT EXISTS rate_at_entry numeric(18,6) NOT NULL DEFAULT 1
    CHECK (rate_at_entry > 0);

COMMENT ON COLUMN public.investments.rate_at_entry IS
  '1 unit of currency = rate_at_entry INR at time of entry. Always 1 for INR holdings.';
