import type { FieldDef } from "./types";

// ─── Expense import fields ────────────────────────────────────────────────────

export const EXPENSE_FIELDS: FieldDef[] = [
  {
    key: "date",
    label: "Date",
    required: true,
    type: "date",
    aliases: ["date", "expense date", "transaction date", "txn date"],
    example: "2024-06-01",
  },
  {
    key: "amount",
    label: "Amount",
    required: true,
    type: "number",
    aliases: ["amount", "expense amount", "value", "cost", "debit"],
    example: "1500",
  },
  {
    key: "category",
    label: "Category",
    required: true,
    type: "text",
    aliases: ["category", "cat", "type"],
    example: "Food",
  },
  {
    key: "note",
    label: "Note",
    required: false,
    type: "text",
    aliases: ["note", "notes", "description", "memo", "narration", "remarks"],
    example: "Grocery shopping",
  },
  {
    key: "currency",
    label: "Currency",
    required: false,
    type: "select",
    options: ["INR", "USD", "EUR", "GBP", "SGD", "AED"],
    aliases: ["currency", "ccy"],
    example: "INR",
    defaultValue: "INR",
  },
];

// ─── Income import fields ─────────────────────────────────────────────────────

export const INCOME_FIELDS: FieldDef[] = [
  {
    key: "date",
    label: "Date",
    required: true,
    type: "date",
    aliases: ["date", "income date", "credit date", "payment date"],
    example: "2024-06-01",
  },
  {
    key: "source_name",
    label: "Source",
    required: true,
    type: "text",
    aliases: ["source", "source name", "name", "income source", "employer", "source_name"],
    example: "Acme Corp",
  },
  {
    key: "amount",
    label: "Amount",
    required: true,
    type: "number",
    aliases: ["amount", "income", "value", "credit"],
    example: "50000",
  },
  {
    key: "category",
    label: "Category",
    required: false,
    type: "select",
    options: ["Salary", "Freelance", "Rental", "Dividend", "Business", "Other"],
    aliases: ["category", "type", "income type"],
    example: "Salary",
    defaultValue: "Other",
  },
  {
    key: "currency",
    label: "Currency",
    required: false,
    type: "select",
    options: ["INR", "USD", "EUR", "GBP", "SGD", "AED"],
    aliases: ["currency", "ccy"],
    example: "INR",
    defaultValue: "INR",
  },
  {
    key: "notes",
    label: "Notes",
    required: false,
    type: "text",
    aliases: ["notes", "note", "description", "memo", "remarks"],
    example: "June salary",
  },
];

// ─── Account import fields ────────────────────────────────────────────────────

export const ACCOUNT_FIELDS: FieldDef[] = [
  {
    key: "name",
    label: "Account Name",
    required: true,
    type: "text",
    aliases: ["name", "account name", "account", "account title"],
    example: "SBI Savings",
  },
  {
    key: "account_type",
    label: "Account Type",
    required: true,
    type: "select",
    options: ["Savings", "Current", "FixedDeposit", "Wallet", "Cash"],
    aliases: ["account type", "type", "account_type", "account kind"],
    example: "Savings",
  },
  {
    key: "balance",
    label: "Balance",
    required: true,
    type: "number",
    aliases: ["balance", "amount", "current balance", "available balance"],
    example: "100000",
  },
  {
    key: "currency",
    label: "Currency",
    required: false,
    type: "select",
    options: ["INR", "USD", "EUR", "GBP", "SGD", "AED"],
    aliases: ["currency", "ccy"],
    example: "INR",
    defaultValue: "INR",
  },
  {
    key: "bank_name",
    label: "Bank Name",
    required: false,
    type: "text",
    aliases: ["bank", "bank name", "bank_name", "institution"],
    example: "State Bank of India",
  },
  {
    key: "notes",
    label: "Notes",
    required: false,
    type: "text",
    aliases: ["notes", "note", "remarks"],
    example: "Primary account",
  },
];

// ─── Subscription import fields ───────────────────────────────────────────────

export const SUBSCRIPTION_FIELDS: FieldDef[] = [
  {
    key: "service_name",
    label: "Service Name",
    required: true,
    type: "text",
    aliases: ["service_name", "service", "name", "app", "subscription", "service name"],
    example: "Netflix",
  },
  {
    key: "amount",
    label: "Amount",
    required: true,
    type: "number",
    aliases: ["amount", "cost", "price", "value"],
    example: "649",
  },
  {
    key: "billing_cycle",
    label: "Billing Cycle",
    required: true,
    type: "select",
    options: ["Monthly", "Yearly", "Quarterly", "Weekly"],
    aliases: [
      "billing_cycle", "billing cycle", "cycle", "frequency", "billing frequency",
      "billing period",
    ],
    example: "Monthly",
  },
  {
    key: "next_renewal_date",
    label: "Next Renewal",
    required: true,
    type: "date",
    aliases: [
      "next_renewal_date", "renewal date", "next renewal", "next billing",
      "renewal", "next billing date", "renewal_date",
    ],
    example: "2024-07-01",
  },
  {
    key: "category",
    label: "Category",
    required: false,
    type: "select",
    options: ["Streaming", "SaaS", "Finance", "Utilities", "Health", "Other"],
    aliases: ["category", "type", "cat"],
    example: "Streaming",
    defaultValue: "Other",
  },
  {
    key: "status",
    label: "Status",
    required: false,
    type: "select",
    options: ["Active", "Paused", "Cancelled"],
    aliases: ["status", "state"],
    example: "Active",
    defaultValue: "Active",
  },
  {
    key: "currency",
    label: "Currency",
    required: false,
    type: "select",
    options: ["INR", "USD", "EUR", "GBP", "SGD", "AED"],
    aliases: ["currency", "ccy"],
    example: "INR",
    defaultValue: "INR",
  },
  {
    key: "notes",
    label: "Notes",
    required: false,
    type: "text",
    aliases: ["notes", "note", "description", "remarks"],
    example: "Family plan",
  },
];

// ─── Holding import fields ────────────────────────────────────────────────────

export const HOLDING_FIELDS: FieldDef[] = [
  {
    key: "asset_name",
    label: "Asset Name",
    required: true,
    type: "text",
    aliases: [
      "asset_name", "asset name", "asset", "name", "stock", "fund",
      "scheme name", "security", "scrip", "company", "instrument",
    ],
    example: "Infosys Ltd",
  },
  {
    key: "asset_type",
    label: "Asset Type",
    required: true,
    type: "select",
    options: ["Stocks", "MutualFund", "FD", "Crypto", "RealEstate", "Gold", "Other"],
    aliases: [
      "asset_type", "asset type", "type", "instrument type",
      "asset class", "class",
    ],
    example: "Stocks",
  },
  {
    key: "quantity",
    label: "Quantity",
    required: true,
    type: "number",
    aliases: [
      "quantity", "qty", "units", "shares", "no of units",
      "number of units", "no. of units", "units held",
    ],
    example: "10",
  },
  {
    key: "buy_price",
    label: "Buy Price",
    required: true,
    type: "number",
    aliases: [
      "buy_price", "buy price", "purchase price", "avg price",
      "average price", "invested price", "nav at purchase",
      "cost price", "avg cost", "average cost",
    ],
    example: "1500",
  },
  {
    key: "current_price",
    label: "Current Price",
    required: true,
    type: "number",
    aliases: [
      "current_price", "current price", "market price", "nav",
      "ltp", "price", "current nav", "cmp", "last price",
    ],
    example: "1750",
  },
  {
    key: "buy_date",
    label: "Buy Date",
    required: true,
    type: "date",
    aliases: [
      "buy_date", "buy date", "purchase date", "date",
      "investment date", "date of purchase", "acquisition date",
    ],
    example: "2023-01-15",
  },
  {
    key: "currency",
    label: "Currency",
    required: false,
    type: "select",
    options: ["INR", "USD", "EUR", "GBP", "SGD", "AED"],
    aliases: ["currency", "ccy"],
    example: "INR",
    defaultValue: "INR",
  },
];
