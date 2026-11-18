import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bot as BotIcon,
  Check,
  ChevronRight,
  CircleDot,
  Cloud,
  Code2,
  Coins,
  Cpu,
  FlaskConical,
  Gauge,
  History,
  KeyRound,
  Layers,
  NotebookPen,
  Pause,
  Play,
  RefreshCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Wallet,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { PageFooter } from "@/components/AppShell";
import { BotConfigModal } from "@/components/BotConfigModal";
import { BreadcrumbTrail } from "@/components/PlanViews";
import {
  Badge,
  BotAvatar,
  Button,
  Panel,
  PanelHead,
  Progress,
  ProviderMark,
  Ring,
  Sparkline,
  Toggle,
} from "@/components/ui";
import { MODELS, PROVIDERS, USER } from "@/lib/data";
import { navigate, usePageTitle } from "@/lib/router";
import { useSimplayz } from "@/lib/store";
import { cn } from "@/utils/cn";

const roleIcons: Record<string, LucideIcon> = {
  CTO: Code2,
  CFO: Wallet,
  COO: Workflow,
};

const fallbacks: Record<string, string> = {
  cto: "gemini-2-5-flash",
  cfo: "claude-haiku-3-5",
  coo: "gpt-4-1-mini",
};

const roleTone: Record<string, "coral" | "sky" | "lime"> = {
  CTO: "coral",
  CFO: "sky",
  COO: "lime",
};

export function AiManagementPage({ userId }: { userId: string }) {
  usePageTitle("AI Management");
  const { world, updateBot, setRule, addActivity, notify } = useSimplayz();
  const [configBotId, setConfigBotId] = useState<string | null>(null);
  const configBot = world.bots.find((bot) => bot.id === configBotId) ?? null;

  const providerFor = (id: string) => PROVIDERS.find((provider) => provider.id === id);
  const modelFor = (id: string) => MODELS.find((model) => model.id === id);
  const totalTokensToday = world.bots.reduce((sum, bot) => sum + bot.tokensToday, 0);
  const totalBotSpend = world.bots.reduce((sum, bot) => sum + bot.monthlySpend, 0);
  const budgetPct = (world.budget.used / world.budget.monthly) * 100;
  const tokenPct = (world.budget.tokenUsed / world.budget.tokenCap) * 100;
  const activeRules = Object.values(world.routingRules).filter(Boolean).length;
  const avgLatency = Math.round(
    world.bots.reduce((sum, bot) => sum + (modelFor(bot.model)?.latency ?? 500), 0) / world.bots.length,
  );
  const connectedProviders = PROVIDERS.filter((provider) => provider.connected).length;

  const tokenTrend = useMemo(() => [24, 38, 31, 54, 41, 62, 49, 58, 44, 66, 53, 61], []);
  const policyRows: Array<{
    key: keyof typeof world.routingRules;
    title: string;
    detail: string;
    Icon: LucideIcon;
  }> = [
    {
      key: "fallback",
      title: "Cross-provider fallback",
      detail: "If the primary model errors or exceeds 1.8 s, route once to the secondary provider.",
      Icon: RefreshCcw,
    },
    {
      key: "costGuard",
      title: "Cost guardrail",
      detail: "Pause non-critical actions above $0.24 per request; escalate to the player instead.",
      Icon: Coins,
    },
    {
      key: "requireApproval",
      title: "Human approval",
      detail: "Require explicit player approval before any building, staffing, or budget mutation.",
      Icon: ShieldCheck,
    },
  ];

  const deploy = () => {
    addActivity({
      bot: "system",
      title: "Crew configuration deployed",
      detail: `${world.bots.length} bots live · ${activeRules} policies enforced · prompt registry signed`,
      tone: "neutral",
    });
    notify(
      "Crew configuration deployed",
      "All three bots are live on the current routing table. Human approval remains available.",
      "lime",
    );
  };

  const togglePaused = (id: "cto" | "cfo" | "coo", current: string) => {
    updateBot(id, { status: current === "online" ? "paused" : "online" });
    addActivity({
      bot: id,
      title: current === "online" ? "Bot paused" : "Bot resumed",
      detail: current === "online" ? "Task queue held. Model routing preserved." : "Task queue resumed with the existing model.",
      tone: "neutral",
    });
    notify(
      current === "online" ? "Bot paused" : "Bot resumed",
      current === "online" ? "Queued tasks will wait for an explicit resume." : "The bot is picking up its queued task.",
      "neutral",
    );
  };

  return (
    <div className="mx-auto max-w-[1560px] px-3 pb-2 pt-4 sm:px-5 lg:px-7">
      <BreadcrumbTrail
        items={[
          { label: "World", onClick: () => navigate("/") },
          { label: "AI", onClick: () => undefined },
          { label: "Management" },
        ]}
        className="mb-3"
      />

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-paper text-ink">
              <Sparkles size={14} />
            </span>
            <Badge tone="dark" dot>
              AI management
            </Badge>
            <span className="font-mono text-[9px] font-medium uppercase tracking-[.09em] text-muted">
              3 bots · 1 orchestration layer · human in the loop
            </span>
          </div>
          <h1 className="font-display text-[34px] font-semibold leading-[.95] tracking-[-.05em] text-ink sm:text-[44px]">
            Your management crew.
          </h1>
          <p className="mt-2 max-w-[76ch] text-[12px] leading-relaxed text-muted">
            Assign the right intelligence to every job. Route each bot to a different provider, set its operating
            temperature, and keep every prompt versioned and within budget.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={() => document.getElementById("activity-log")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            <History size={14} />
            Activity log
          </Button>
          <Button variant="primary" size="md" onClick={deploy}>
            <Cloud size={14} />
            Deploy changes
          </Button>
        </div>
      </div>

      <Panel className="mt-4 overflow-hidden rounded-[18px] border-ink bg-ink text-paper">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5">
          <div className="border-b border-white/10 px-4 py-3.5 sm:border-b-0 sm:border-r">
            <div className="flex items-center gap-1.5 font-mono text-[7.5px] font-medium uppercase tracking-[.1em] text-white/45">
              <span className="h-1.5 w-1.5 rounded-full bg-lime" />
              Crew online
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="font-display text-[24px] font-semibold leading-none tracking-[-.03em]">
                {world.bots.filter((bot) => bot.status === "online").length}
              </span>
              <span className="text-[10px] text-white/40">/ 3</span>
            </div>
            <div className="mt-1 font-mono text-[7px] uppercase tracking-[.04em] text-lime/80">all roles staffed</div>
          </div>
          <div className="border-b border-white/10 px-4 py-3.5 sm:border-b-0 sm:border-r">
            <div className="flex items-center gap-1.5 font-mono text-[7.5px] font-medium uppercase tracking-[.1em] text-white/45">
              <Wallet size={10} />
              Monthly spend
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="font-display text-[24px] font-semibold leading-none tracking-[-.03em]">
                ${world.budget.used.toFixed(0)}
              </span>
              <span className="text-[10px] text-white/40">/ ${world.budget.monthly.toLocaleString()}</span>
            </div>
            <Progress value={budgetPct} tone="#c9f95f" className="mt-2 h-[3px] bg-white/15" height={3} />
          </div>
          <div className="border-b border-white/10 px-4 py-3.5 sm:border-b-0 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-1.5 font-mono text-[7.5px] font-medium uppercase tracking-[.1em] text-white/45">
              <TrendingUp size={10} />
              Tokens today
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="font-display text-[24px] font-semibold leading-none tracking-[-.03em]">
                {(totalTokensToday / 1000).toFixed(1)}k
              </span>
              <span className="text-[10px] text-lime">+12%</span>
            </div>
            <div className="mt-0.5 h-[14px] w-full opacity-70">
              <Sparkline values={tokenTrend} color="#c9f95f" height={14} />
            </div>
          </div>
          <div className="border-b border-white/10 px-4 py-3.5 sm:border-b-0 sm:border-r lg:border-r">
            <div className="flex items-center gap-1.5 font-mono text-[7.5px] font-medium uppercase tracking-[.1em] text-white/45">
              <Gauge size={10} />
              p50 latency
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="font-display text-[24px] font-semibold leading-none tracking-[-.03em]">{avgLatency}</span>
              <span className="text-[10px] text-white/40">ms</span>
            </div>
            <div className="mt-1 font-mono text-[7px] uppercase tracking-[.04em] text-white/40">fallback armed</div>
          </div>
          <div className="col-span-2 flex items-center justify-between gap-3 px-4 py-3.5 sm:col-span-4 lg:col-span-1">
            <div>
              <div className="font-mono text-[7.5px] font-medium uppercase tracking-[.1em] text-white/45">
                Providers
              </div>
              <div className="mt-1 font-mono text-[7px] text-white/35">{connectedProviders} / 7 connected</div>
            </div>
            <div className="flex -space-x-1">
              {PROVIDERS.slice(0, 5).map((provider) => (
                <span key={provider.id} className="rounded-[7px] border border-white/20">
                  <ProviderMark provider={provider} size={20} />
                </span>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      <div className="mt-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 font-mono text-[8.5px] font-semibold uppercase tracking-[.11em] text-muted">
            <BotIcon size={11} />
            Management crew
          </div>
          <h2 className="mt-1 font-display text-[24px] font-semibold tracking-[-.035em]">Three specialists, three brains</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden font-mono text-[8px] uppercase tracking-[.05em] text-muted sm:block">
            Click a model to reassign
          </span>
          <Badge tone="lime" dot>
            All systems nominal
          </Badge>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {world.bots.map((bot) => {
          const provider = providerFor(bot.provider);
          const model = modelFor(bot.model);
          const RoleIcon = roleIcons[bot.role] ?? Sparkles;
          return (
            <article
              key={bot.id}
              className="group relative flex flex-col overflow-hidden rounded-[22px] border border-line bg-paper shadow-soft transition-all duration-200 hover:shadow-float"
            >
              <div
                className="relative overflow-hidden px-4 pb-3.5 pt-4"
                style={{
                  background: `linear-gradient(148deg, ${bot.accentSoft} 0%, ${bot.accentSoft} 28%, #fbfaf4 100%)`,
                }}
              >
                <span
                  className="pointer-events-none absolute -bottom-4 -right-1 select-none font-display text-[92px] font-extrabold leading-none tracking-[-.08em] opacity-[.07]"
                  style={{ color: bot.accent }}
                  aria-hidden="true"
                >
                  {bot.role}
                </span>
                <div className="relative flex items-start justify-between gap-2">
                  <BotAvatar bot={bot} size={50} />
                  <div className="flex items-center gap-1.5">
                    <Badge tone={roleTone[bot.role]} className="gap-1">
                      <RoleIcon size={9} />
                      {bot.role}
                    </Badge>
                    <span
                      className={cn(
                        "flex items-center gap-1 rounded-full border px-2 py-[3px] font-mono text-[7.5px] font-semibold uppercase tracking-[.04em]",
                        bot.status === "online"
                          ? "border-[#cfe2a8] bg-lime-soft text-[#4f681c]"
                          : "border-line bg-bone text-muted",
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", bot.status === "online" ? "bg-lime-deep animate-pulse-dot" : "bg-muted-light")} />
                      {bot.status}
                    </span>
                  </div>
                </div>
                <div className="relative mt-3 flex items-baseline gap-2">
                  <h3 className="font-display text-[26px] font-semibold leading-none tracking-[-.045em] text-ink">
                    {bot.name}
                  </h3>
                  <span className="text-[10.5px] font-medium text-muted">{bot.title}</span>
                </div>
                <p className="relative mt-1 text-[10.5px] leading-relaxed text-muted">{bot.tagline}</p>
                <div className="relative mt-3 rounded-xl border border-white/70 bg-paper/70 px-2.5 py-2 shadow-[0_1px_0_rgba(255,255,255,.6)_inset] backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 font-mono text-[7px] font-semibold uppercase tracking-[.08em] text-ink/50">
                    <span className={cn("h-1 w-1 rounded-full", bot.status === "online" ? "bg-lime-deep animate-pulse-dot" : "bg-muted-light")} />
                    {bot.status === "online" ? "Working now" : "Queue paused"}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[10.5px] font-medium leading-snug text-ink/80">{bot.task}</p>
                </div>
              </div>

              <div className="flex flex-1 flex-col px-4 pb-3.5 pt-3">
                <button
                  type="button"
                  onClick={() => setConfigBotId(bot.id)}
                  className="group/model flex w-full items-center gap-2.5 rounded-xl border border-line bg-bone/30 p-2.5 text-left transition-all hover:border-ink/40 hover:bg-paper"
                >
                  {provider && <ProviderMark provider={provider} size={26} />}
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[7px] font-semibold uppercase tracking-[.09em] text-muted">
                      {provider?.name} · {provider?.region}
                    </div>
                    <div className="mt-0.5 truncate text-[11.5px] font-bold text-ink">{model?.name ?? bot.model}</div>
                  </div>
                  <span className="flex items-center gap-1 rounded-full border border-line bg-paper px-2 py-1 text-[8px] font-semibold text-muted transition-colors group-hover/model:border-ink group-hover/model:text-ink">
                    Change <ChevronRight size={9} />
                  </span>
                </button>

                <div className="mt-2 grid grid-cols-3 divide-x divide-line rounded-xl border border-line/70 bg-paper">
                  {[
                    { label: "Temp", value: bot.temperature.toFixed(1) },
                    { label: "Output", value: bot.responseFormat === "Structured JSON" ? "JSON" : bot.responseFormat === "Markdown brief" ? "Brief" : "Table" },
                    { label: "Prompt", value: bot.promptVersion },
                  ].map((item) => (
                    <div key={item.label} className="px-2 py-1.5">
                      <div className="font-mono text-[6.5px] uppercase tracking-[.06em] text-muted">{item.label}</div>
                      <div className="mt-0.5 font-mono text-[9px] font-semibold text-ink">{item.value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-2.5 space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-[7.5px] uppercase tracking-[.05em] text-muted">Token burn today</span>
                    <span className="font-mono text-[8px] text-ink">
                      {(bot.tokensToday / 1000).toFixed(1)}k <span className="text-muted">/ 50k</span>
                    </span>
                  </div>
                  <Progress
                    value={(bot.tokensToday / 50000) * 100}
                    tone={bot.accent}
                    height={3}
                  />
                </div>

                <div className="mt-auto flex items-center gap-1.5 pt-3">
                  <Button variant="primary" size="sm" className="flex-1" onClick={() => setConfigBotId(bot.id)}>
                    <SlidersHorizontal size={11} />
                    Configure
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={bot.status === "online" ? `Pause ${bot.name}` : `Resume ${bot.name}`}
                    title={bot.status === "online" ? "Pause bot" : "Resume bot"}
                    onClick={() => togglePaused(bot.id, bot.status)}
                  >
                    {bot.status === "online" ? <Pause size={11} /> : <Play size={11} />}
                  </Button>
                  <span className="rounded-full border border-line px-2 py-1 font-mono text-[8px] text-muted">
                    ${bot.monthlySpend.toFixed(1)}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-12">
        <Panel className="overflow-hidden lg:col-span-8">
          <PanelHead
            eyebrow="Orchestration"
            title="Routing & guardrails"
            description="One predictable route per role. Policies are evaluated before every model call."
            icon={<Workflow size={13} />}
            action={<Badge tone="lime">{activeRules} / 3 active</Badge>}
          />
          <div className="mx-4 mb-3 overflow-hidden rounded-xl border border-line">
            {policyRows.map((policy, index) => {
              const Icon = policy.Icon;
              return (
                <div
                  key={policy.key}
                  className={cn(
                    "flex items-center gap-3 bg-bone/25 px-3 py-2.5",
                    index !== policyRows.length - 1 && "border-b border-line",
                  )}
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-line bg-paper text-muted">
                    <Icon size={12} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10.5px] font-bold text-ink">{policy.title}</div>
                    <div className="mt-0.5 line-clamp-1 text-[9px] text-muted">{policy.detail}</div>
                  </div>
                  <Toggle
                    checked={world.routingRules[policy.key]}
                    onChange={(value) => {
                      setRule(policy.key, value);
                      notify(
                        `${policy.title} ${value ? "enabled" : "disabled"}`,
                        "Policy applies to the next model call.",
                        value ? "lime" : "neutral",
                      );
                    }}
                    label={policy.title}
                  />
                </div>
              );
            })}
          </div>

          <div className="mx-4 mb-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-mono text-[7.5px] font-semibold uppercase tracking-[.1em] text-muted">Live routing table</span>
              <span className="flex items-center gap-1 font-mono text-[7px] uppercase text-sage-deep">
                <CircleDot size={8} /> registry synced
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-bone/40">
                    {["Bot", "Primary", "Fallback", "Latency"].map((heading) => (
                      <th
                        key={heading}
                        className="px-2.5 py-1.5 font-mono text-[6.5px] font-semibold uppercase tracking-[.08em] text-muted first:pl-3 last:text-right last:pr-3"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {world.bots.map((bot) => {
                    const primary = modelFor(bot.model);
                    const fallback = modelFor(fallbacks[bot.id] ?? "gpt-4-1-mini");
                    return (
                      <tr key={bot.id} className="border-b border-line/70 last:border-0">
                        <td className="px-2.5 py-2 pl-3">
                          <div className="flex items-center gap-1.5">
                            <BotAvatar bot={bot} size={20} />
                            <div>
                              <div className="text-[9.5px] font-bold leading-tight text-ink">{bot.name}</div>
                              <div className="font-mono text-[6.5px] uppercase tracking-[.04em] text-muted">{bot.role}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2.5 py-2">
                          <span className="font-mono text-[8px] font-medium text-ink">{primary?.name}</span>
                          <span className="ml-1.5 rounded bg-bone px-1 py-0.5 font-mono text-[6px] uppercase text-muted">
                            {providerFor(bot.provider)?.name}
                          </span>
                        </td>
                        <td className="px-2.5 py-2">
                          <span className="font-mono text-[8px] text-muted">{fallback?.name}</span>
                        </td>
                        <td className="px-2.5 py-2 pr-3 text-right font-mono text-[8px] text-muted">
                          {primary?.latency} ms
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Panel>

        <div className="flex flex-col gap-3 lg:col-span-4">
          <Panel className="overflow-hidden">
            <PanelHead
              eyebrow="Budget & usage"
              title="Spend envelope"
              icon={<Coins size={13} />}
              action={<Badge tone="outline">resets in 12d</Badge>}
            />
            <div className="flex items-center gap-4 px-4">
              <Ring value={budgetPct} size={92} stroke={8} color="#172019">
                <div>
                  <div className="font-display text-[20px] font-semibold leading-none tracking-[-.03em]">
                    {Math.round(budgetPct)}%
                  </div>
                  <div className="mt-0.5 font-mono text-[6.5px] uppercase tracking-[.05em] text-muted">used</div>
                </div>
              </Ring>
              <div className="min-w-0 flex-1">
                <div className="font-display text-[23px] font-semibold leading-none tracking-[-.03em]">
                  ${world.budget.used.toFixed(2)}
                </div>
                <div className="mt-1 text-[9px] text-muted">of ${world.budget.monthly.toLocaleString()} monthly cap</div>
                <div className="mt-2 h-[24px] w-full">
                  <Sparkline values={[29, 34, 31, 38, 35, 39]} color="#78923c" height={24} />
                </div>
              </div>
            </div>
            <div className="mt-3 px-4">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[7.5px] uppercase tracking-[.05em] text-muted">Context tokens</span>
                <span className="font-mono text-[8px] text-ink">
                  {(world.budget.tokenUsed / 1_000_000).toFixed(2)}M{" "}
                  <span className="text-muted">/ {(world.budget.tokenCap / 1_000_000).toFixed(0)}M</span>
                </span>
              </div>
              <Progress value={tokenPct} tone="#78923c" className="mt-1.5" height={4} />
            </div>
            <div className="mt-3 divide-y divide-line border-t border-line">
              {world.bots.map((bot) => (
                <div key={bot.id} className="flex items-center gap-2 px-4 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: bot.accent }} />
                  <span className="flex-1 text-[9.5px] font-medium text-ink/80">{bot.name}</span>
                  <div className="h-1 w-16 overflow-hidden rounded-full bg-bone-deep">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(bot.monthlySpend / totalBotSpend) * 100}%`, background: bot.accent }}
                    />
                  </div>
                  <span className="w-9 text-right font-mono text-[8px] text-muted">${bot.monthlySpend.toFixed(1)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-line px-4 py-2">
              <span className="font-mono text-[7px] uppercase tracking-[.04em] text-muted">Bot subtotal</span>
              <button
                type="button"
                onClick={() => notify("Budget increase requested", "Ledger will return a scenario brief within the guardrails.", "sky")}
                className="flex items-center gap-1 text-[8.5px] font-semibold text-ink hover:text-muted"
              >
                ${totalBotSpend.toFixed(2)} · request <ArrowUpRight size={9} />
              </button>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHead eyebrow="Access" title="Provider keys" icon={<KeyRound size={13} />} action={<Badge tone="lime" dot>secure</Badge>} />
            <div className="grid grid-cols-2 gap-1 px-3 pb-3">
              {PROVIDERS.map((provider) => (
                <div key={provider.id} className="flex items-center gap-1.5 rounded-lg px-1.5 py-1">
                  <ProviderMark provider={provider} size={19} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[9px] font-semibold text-ink">{provider.name}</span>
                    <span className="block font-mono text-[6.5px] uppercase tracking-[.03em] text-muted">{provider.region}</span>
                  </span>
                  <span
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      provider.connected ? "bg-lime-deep" : "border border-muted-light bg-transparent",
                    )}
                    title={provider.connected ? "Connected" : "API key needed"}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-line px-4 py-2">
              <span className="flex items-center gap-1 text-[8px] text-muted">
                <ShieldCheck size={9} className="text-sage-deep" /> keys encrypted at rest
              </span>
              <button
                type="button"
                onClick={() => notify("Key vault is read-only", "In production this opens the workspace secret manager.", "neutral")}
                className="text-[8.5px] font-semibold text-ink hover:text-muted"
              >
                Manage
              </button>
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-12">
        <Panel className="overflow-hidden lg:col-span-7">
          <PanelHead
            eyebrow="Prompt engineering"
            title="Prompt registry"
            description="Prompts are treated like code: explicit output, versioned, tested, and grounded."
            icon={<NotebookPen size={13} />}
            action={<Badge tone="outline">standard v3</Badge>}
          />
          <div className="mx-4 overflow-hidden rounded-xl border border-line">
            <div className="grid grid-cols-[1.5fr_1fr_1fr_auto] items-center gap-2 border-b border-line bg-bone/40 px-3 py-1.5 font-mono text-[6.5px] font-semibold uppercase tracking-[.08em] text-muted">
              <span>Bot</span>
              <span>Contract</span>
              <span>Evaluation</span>
              <span />
            </div>
            {world.bots.map((bot, index) => (
              <div
                key={bot.id}
                className={cn(
                  "grid grid-cols-[1.5fr_1fr_1fr_auto] items-center gap-2 px-3 py-2.5",
                  index !== world.bots.length - 1 && "border-b border-line",
                )}
              >
                <div className="flex items-center gap-2">
                  <BotAvatar bot={bot} size={22} />
                  <div className="min-w-0">
                    <div className="truncate text-[10px] font-bold text-ink">{bot.name}</div>
                    <div className="font-mono text-[6.5px] uppercase tracking-[.04em] text-muted">{bot.promptVersion} · {bot.role}</div>
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-medium text-ink">{bot.responseFormat}</div>
                  <div className="mt-0.5 flex items-center gap-1 font-mono text-[6.5px] text-muted">
                    <ShieldCheck size={7} className="text-sage-deep" /> grounded
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-lime-soft px-1.5 py-0.5 font-mono text-[6.5px] font-semibold uppercase text-[#4f681c]">
                    14 / 14
                  </span>
                  <span className="hidden font-mono text-[6.5px] text-muted sm:inline">· 2h ago</span>
                </div>
                <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[8px]" onClick={() => setConfigBotId(bot.id)}>
                  Inspect <ArrowUpRight size={9} />
                </Button>
              </div>
            ))}
          </div>
          <div className="mx-4 mb-4 mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-sage/30 px-3 py-2.5">
            <span className="flex items-center gap-1 font-mono text-[7px] font-semibold uppercase tracking-[.06em] text-ink/70">
              <FlaskConical size={10} className="text-sage-deep" /> linted
            </span>
            {["explicit format", "hard constraints", "versioned", "no assumed context"].map((criterion) => (
              <span
                key={criterion}
                className="flex items-center gap-1 rounded-full border border-line bg-paper/80 px-1.5 py-0.5 text-[7px] font-medium text-muted"
              >
                <Check size={7} className="text-sage-deep" />
                {criterion}
              </span>
            ))}
          </div>
        </Panel>

        <Panel id="activity-log" className="overflow-hidden lg:col-span-5">
          <PanelHead
            eyebrow="Audit trail"
            title="Activity log"
            icon={<History size={13} />}
            action={
              <span className="flex items-center gap-1 font-mono text-[7px] font-semibold uppercase tracking-[.06em] text-sage-deep">
                <span className="h-1.5 w-1.5 rounded-full bg-lime-deep animate-pulse-dot" /> live
              </span>
            }
          />
          <div className="mx-4 max-h-[302px] overflow-y-auto rounded-xl border border-line thin-scroll">
            {world.activity.map((entry, index) => {
              const entryBot = world.bots.find((bot) => bot.id === entry.bot);
              const toneClass =
                entry.tone === "lime"
                  ? "bg-lime-soft text-[#4f681c]"
                  : entry.tone === "sky"
                    ? "bg-sky-soft text-[#3c6783]"
                    : entry.tone === "coral"
                      ? "bg-coral-soft text-[#9b4a2c]"
                      : "bg-bone-deep text-muted";
              return (
                <div
                  key={entry.id}
                  className={cn("flex gap-2.5 px-3 py-2.5", index !== world.activity.length - 1 && "border-b border-line/80")}
                >
                  {entryBot ? (
                    <BotAvatar bot={entryBot} size={26} />
                  ) : (
                    <span className={cn("grid h-[26px] w-[26px] shrink-0 place-items-center rounded-lg", toneClass)}>
                      <Sparkles size={12} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[9.5px] font-bold text-ink">{entry.title}</span>
                      <span className="shrink-0 font-mono text-[6.5px] uppercase tracking-[.03em] text-muted-light">{entry.time}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[8.5px] leading-relaxed text-muted">{entry.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-2.5">
            <span className="font-mono text-[7px] uppercase tracking-[.04em] text-muted">
              {world.activity.length} events · 30d retention
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[8.5px]"
              onClick={() => notify("Audit export queued", "A signed CSV will be available from the workspace shortly.", "sky")}
            >
              Export <ArrowRight size={9} />
            </Button>
          </div>
        </Panel>
      </div>

      <Panel className="mt-3 overflow-hidden rounded-[18px] bg-paper/55 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-line bg-paper text-muted">
              <Cpu size={13} />
            </span>
            <div>
              <div className="text-[10.5px] font-bold text-ink">Provider-agnostic orchestration</div>
              <p className="mt-0.5 text-[9px] leading-relaxed text-muted">
                Mix models freely. Your crew keeps a single audit trail, one budget envelope, and the same explicit
                prompt standards across every provider.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {PROVIDERS.slice(0, 6).map((provider) => (
              <ProviderMark key={provider.id} provider={provider} size={22} />
            ))}
            <span className="ml-1 font-mono text-[7.5px] text-muted">+ local</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/user/${userId || USER.id}/area/delfshaven-yard`)}
          >
            <Layers size={11} />
            Back to the world
          </Button>
        </div>
      </Panel>

      <PageFooter />

      {configBot && (
        <BotConfigModal
          bot={configBot}
          onClose={() => setConfigBotId(null)}
          onSave={(patch) => {
            const promptChanged = Boolean(patch.systemPrompt && patch.systemPrompt !== configBot.systemPrompt);
            const [major, minor] = configBot.promptVersion.replace("v", "").split(".").map(Number);
            const nextPatch = promptChanged
              ? { ...patch, promptVersion: `v${major}.${(minor || 0) + 1}` }
              : patch;
            updateBot(configBot.id, nextPatch);
            const nextModel = MODELS.find((model) => model.id === patch.model);
            const nextProvider = PROVIDERS.find((provider) => provider.id === patch.provider);
            addActivity({
              bot: configBot.id,
              title: "Model route updated",
              detail: `${configBot.name} now runs ${nextModel?.name ?? patch.model} on ${nextProvider?.name ?? patch.provider} · temp ${(patch.temperature ?? configBot.temperature).toFixed(1)}`,
              tone: configBot.id === "cto" ? "coral" : configBot.id === "cfo" ? "sky" : "lime",
            });
            notify(
              `${configBot.name} rerouted`,
              `${nextProvider?.name ?? "Provider"} · ${nextModel?.name ?? "model"} saved. Deploy to push to runtime.`,
              "lime",
            );
            setConfigBotId(null);
          }}
        />
      )}
    </div>
  );
}
