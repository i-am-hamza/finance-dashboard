"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import {
  TrendingUp, Wallet, CreditCard, ReceiptText, RefreshCw, BarChart2,
  ShieldCheck, Database, EyeOff, UserPlus, Upload, Activity,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Static data ───────────────────────────────────────────────────────────────

const CHART_DATA = [
  { v: 420 }, { v: 435 }, { v: 428 }, { v: 451 },
  { v: 468 }, { v: 482 }, { v: 495 }, { v: 510 },
];

const FEATURES = [
  { icon: TrendingUp, name: "Income Logging",    desc: "Track salary, freelance, dividends and more" },
  { icon: Wallet,     name: "Cash & Savings",    desc: "All your accounts and balances in one view"  },
  { icon: CreditCard, name: "EMI & Debts",       desc: "Know exactly what you owe and when"          },
  { icon: BarChart2,  name: "Budget vs Actual",  desc: "Set budgets. See where money really goes"    },
  { icon: RefreshCw,  name: "Subscriptions",     desc: "Never miss a renewal or overspend on SaaS"   },
  { icon: Activity,   name: "Investments",       desc: "Snapshot your portfolio. Track P&L over time" },
];

const STEPS = [
  { n: "01", icon: UserPlus, title: "Create your account",            desc: "Sign up in seconds — no credit card required."                   },
  { n: "02", icon: Upload,   title: "Add your financial data",        desc: "Enter manually or import via CSV from any bank or broker."        },
  { n: "03", icon: TrendingUp, title: "Watch your net worth come to life", desc: "Your complete financial picture, always current."            },
];

const TRUST = [
  { icon: ShieldCheck, text: "Row-level security — only you can access your data"     },
  { icon: Database,    text: "Hosted on Supabase — enterprise-grade PostgreSQL"       },
  { icon: EyeOff,      text: "No ads, no selling data, ever"                          },
];

const STATS = ["7 Modules", "Multi-currency", "Your data, only yours"];

const HEADLINE = ["Every rupee.", "Every goal.", "One place."];

// ── Navbar ────────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 10);
      setVisible(y < lastY.current || y < 60);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={false}
      animate={{ y: visible ? 0 : -80 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-colors duration-300",
        scrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Image
            src="/Finora icon.png"
            alt="Finora"
            width={28}
            height={28}
            className="dark:invert"
          />
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            Finora
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Log in
          </Link>
          <Link href="/signup" className={cn(buttonVariants({ size: "sm" }), "rounded-lg")}>
            Get started
          </Link>
        </div>
      </div>
    </motion.header>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-16 md:pt-44 md:pb-20">
      {/* Animated gradient blobs */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-slate-300/20 dark:bg-slate-700/15 blur-3xl"
          animate={{ x: [0, 55, 0], y: [0, 35, 0] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -top-20 right-[-100px] h-[360px] w-[360px] rounded-full bg-slate-200/15 dark:bg-slate-600/12 blur-3xl"
          animate={{ x: [0, -35, 0], y: [0, 55, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 8 }}
        />
        <motion.div
          className="absolute bottom-0 left-1/2 h-[280px] w-[280px] -translate-x-1/2 rounded-full bg-slate-200/12 dark:bg-slate-700/8 blur-3xl"
          animate={{ x: [0, 25, -25, 0], y: [0, -25, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 text-center md:px-6">
        {/* Eyebrow pill */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-6 inline-flex items-center rounded-full border border-border bg-background/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm"
        >
          Personal Finance, Reimagined
        </motion.div>

        {/* Headline */}
        <h1 className="mb-6 text-5xl font-bold leading-[1.1] tracking-tight text-foreground md:text-6xl lg:text-7xl">
          {HEADLINE.map((line, i) => (
            <motion.span
              key={line}
              className="block"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.12, ease: "easeOut" }}
            >
              {line}
            </motion.span>
          ))}
        </h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.58, ease: "easeOut" }}
          className="mx-auto mb-8 max-w-lg text-base text-muted-foreground md:text-lg"
        >
          Finora brings your income, debts, EMIs, investments, subscriptions and
          budgets into a single clean dashboard — built for the way you actually
          manage money.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.72, ease: "easeOut" }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "rounded-xl px-7")}>
            Start for free
          </Link>
          <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "rounded-xl px-7")}>
            Sign in
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ── Dashboard Preview ─────────────────────────────────────────────────────────

function DashboardPreview() {
  return (
    <section className="pb-20 md:pb-28">
      <div className="mx-auto max-w-2xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9, ease: "easeOut" }}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            className="rounded-2xl border border-border bg-card p-5 shadow-2xl shadow-slate-900/10 dark:shadow-black/30 ring-1 ring-slate-900/5 dark:ring-white/5"
          >
            {/* Header row */}
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Net Worth</p>
                <p className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">
                  ₹12,47,350
                </p>
                <p className="mt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  ↑ 4.2% vs last month
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["Cash", "Invest", "Debt"].map((label) => (
                  <span
                    key={label}
                    className="rounded-md border border-border bg-muted/60 px-2 py-1 text-[10px] font-medium text-muted-foreground"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Mini chart */}
            <div className="overflow-hidden rounded-xl bg-muted/30 px-2 pt-3 pb-1">
              <ResponsiveContainer width="100%" height={72}>
                <AreaChart data={CHART_DATA} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="previewGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#64748b" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#64748b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="#64748b"
                    strokeWidth={1.5}
                    fill="url(#previewGrad)"
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Stat chips */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: "Monthly Income", value: "₹82,500" },
                { label: "Expenses",       value: "₹41,200" },
                { label: "Savings Rate",   value: "50.1%"   },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-lg border border-border bg-background p-2.5"
                >
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Stats Bar ─────────────────────────────────────────────────────────────────

function StatsBar() {
  return (
    <section className="border-y border-border bg-muted/30 py-7">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true }}
        className="mx-auto max-w-4xl px-4 md:px-6"
      >
        <div className="flex flex-col items-center gap-5 md:flex-row md:justify-center">
          {STATS.map((stat, i) => (
            <div key={stat} className="flex items-center gap-5">
              <span className="text-sm font-medium text-muted-foreground">{stat}</span>
              {i < STATS.length - 1 && (
                <span className="hidden h-4 w-px bg-border md:block" />
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────

function FeaturesSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <div className="mb-12 text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            viewport={{ once: true }}
            className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Everything in one place
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
            viewport={{ once: true }}
            className="text-3xl font-bold tracking-tight text-foreground md:text-4xl"
          >
            Built for real financial lives
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, name, desc }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.07, ease: "easeOut" }}
              viewport={{ once: true }}
              className="group rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                <Icon size={16} className="text-slate-600 dark:text-slate-300" strokeWidth={1.75} />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-foreground">{name}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How It Works ──────────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <section className="bg-muted/20 py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <div className="mb-12 text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            viewport={{ once: true }}
            className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Simple by design
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
            viewport={{ once: true }}
            className="text-3xl font-bold tracking-tight text-foreground md:text-4xl"
          >
            Up and running in minutes
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {STEPS.map(({ n, icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: "easeOut" }}
              viewport={{ once: true }}
            >
              <span className="mb-3 block text-5xl font-bold leading-none text-slate-200 dark:text-slate-700 select-none">
                {n}
              </span>
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                <Icon size={16} className="text-slate-600 dark:text-slate-300" strokeWidth={1.75} />
              </div>
              <h3 className="mb-1.5 text-base font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Privacy ───────────────────────────────────────────────────────────────────

function PrivacySection() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-2xl px-4 text-center md:px-6">
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          viewport={{ once: true }}
          className="mb-10 text-3xl font-bold tracking-tight text-foreground md:text-4xl"
        >
          Your data is yours. Always.
        </motion.h2>
        <div className="flex flex-col items-center gap-4">
          {TRUST.map(({ icon: Icon, text }, i) => (
            <motion.div
              key={text}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
              viewport={{ once: true }}
              className="flex items-center gap-2.5 text-sm text-muted-foreground"
            >
              <Icon size={15} className="shrink-0 text-slate-400" strokeWidth={1.75} />
              {text}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Final CTA ─────────────────────────────────────────────────────────────────

function CTASection() {
  return (
    <section className="pb-16 md:pb-24">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          viewport={{ once: true }}
          className="rounded-2xl bg-slate-900 dark:bg-slate-800 px-8 py-14 text-center"
        >
          <h2 className="mb-2 text-3xl font-bold tracking-tight text-slate-50 md:text-4xl">
            Start tracking what matters
          </h2>
          <p className="mb-8 text-sm text-slate-400">
            Free to use. No credit card required.
          </p>
          <Link
            href="/signup"
            className={cn(
              buttonVariants({ size: "lg" }),
              "rounded-xl bg-white px-8 text-slate-900 hover:bg-slate-100 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            )}
          >
            Create your account
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 md:flex-row md:px-6">
        <span className="text-sm font-semibold text-foreground">
          Finora{" "}
          <span className="font-normal text-muted-foreground">© 2026</span>
        </span>
        <span className="text-xs text-muted-foreground">
          Built by One Sentient
        </span>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <HeroSection />
      <DashboardPreview />
      <StatsBar />
      <FeaturesSection />
      <HowItWorks />
      <PrivacySection />
      <CTASection />
      <Footer />
    </div>
  );
}
