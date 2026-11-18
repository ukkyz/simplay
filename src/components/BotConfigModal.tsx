import { useMemo, useState } from "react";
import { Check, FlaskConical, ShieldCheck, Sparkles, X } from "lucide-react";
import type { Bot, ProviderId } from "@/lib/types";
import { MODELS, PROVIDERS } from "@/lib/data";
import { cn } from "@/utils/cn";
import {
  Badge,
  Button,
  Field,
  Modal,
  ProviderMark,
  Slider,
  inputClass,
} from "./ui";

const responseFormats: Array<Bot["responseFormat"]> = ["Structured JSON", "Markdown brief", "Table"];

const testOutputs: Record<Bot["id"], string> = {
  cto: `{
  "decision": "Approve Foundry Hall room subdivision; merge the two new windows into one 2.4m band.",
  "risk": "Draw calls rise from 22 to 24 at LOD0. Still within the 40-call area budget.",
  "next_action": "Export LOD2 with the merged window band and re-sample at 3m.",
  "confidence": 86
}`,
  cfo: `DECISION BRIEF — 3 checks
1. Foundry Hall upkeep lands at 1,940 credits/week, inside the 2,100 cap.
2. Footfall is +8% against the 30-day average; cafe margin absorbs the night guard cost.
3. Cash buffer remains at 14.2 weeks.

{ "decision": "Release the scheduled 1,200 credit draw", "risk": "low", "next_action": "Post the updated upkeep forecast", "confidence": 91 }`,
  coo: `| Shift | Guard | Reception | Coverage |
|-------|-------|-----------|----------|
| 08-16 | Kai   | Iris      | 100%     |
| 16-20 | Bo    | Lena      | 100%     |
| 20-02 | Kai   | Mina      | 100%     |

{ "decision": "Keep the existing rota", "risk": "medium handoff at 20:00", "next_action": "Confirm Bo's 15-minute overlap", "confidence": 88 }`,
};

export function BotConfigModal({
  bot,
  onClose,
  onSave,
}: {
  bot: Bot;
  onClose: () => void;
  onSave: (patch: Partial<Bot>) => void;
}) {
  const [provider, setProvider] = useState<ProviderId>(bot.provider);
  const [model, setModel] = useState(bot.model);
  const [temperature, setTemperature] = useState(bot.temperature);
  const [prompt, setPrompt] = useState(bot.systemPrompt);
  const [format, setFormat] = useState<Bot["responseFormat"]>(bot.responseFormat);
  const [tested, setTested] = useState(false);

  const availableModels = useMemo(() => MODELS.filter((entry) => entry.provider === provider), [provider]);
  const selectedModel = MODELS.find((entry) => entry.id === model);
  const currentProvider = PROVIDERS.find((entry) => entry.id === provider);
  const canSave = prompt.trim().length >= 40 && Boolean(selectedModel);
  const estimatedTokens = Math.ceil(prompt.length / 4);

  const chooseProvider = (nextProvider: ProviderId) => {
    setProvider(nextProvider);
    const firstModel = MODELS.find((entry) => entry.provider === nextProvider);
    if (firstModel) setModel(firstModel.id);
    setTested(false);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={
        <span className="flex items-center gap-2.5">
          Configure {bot.name}
          <Badge tone="outline" className="translate-y-[-1px]">{bot.role}</Badge>
        </span>
      }
      description="Route this management bot to any frontier model. Changes stay in draft until you save and deploy."
      width="max-w-[820px]"
    >
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-bone/45 p-3">
          <span
            className="grid h-10 w-10 place-items-center rounded-xl font-display text-[12px] font-bold text-ink"
            style={{ background: bot.accentSoft, color: bot.accent }}
          >
            {bot.role}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[11.5px] font-bold text-ink">{bot.title} · {bot.name}</div>
            <p className="mt-0.5 text-[10px] leading-relaxed text-muted">{bot.tagline}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[.05em] text-sage-deep">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-deep" />
              {bot.status}
            </span>
            <span className="rounded-full border border-line bg-paper px-2 py-1 font-mono text-[8px] text-muted">
              prompt {bot.promptVersion}
            </span>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-baseline justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-[.09em] text-ink/70">Model provider</h3>
            <span className="text-[9.5px] text-muted">
              {PROVIDERS.filter((entry) => entry.connected).length} connected · {MODELS.length} models available
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-7">
            {PROVIDERS.map((entry) => {
              const selected = entry.id === provider;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => chooseProvider(entry.id)}
                  aria-pressed={selected}
                  className={cn(
                    "relative flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all",
                    selected
                      ? "border-ink bg-paper shadow-sm ring-1 ring-ink"
                      : "border-line bg-paper/60 hover:border-line-strong hover:bg-paper",
                  )}
                >
                  <ProviderMark provider={entry} size={26} />
                  <span className="truncate text-[9px] font-bold text-ink">{entry.name}</span>
                  <span
                    className={cn(
                      "flex items-center gap-1 font-mono text-[6.5px] uppercase tracking-[.03em]",
                      entry.connected ? "text-sage-deep" : "text-muted-light",
                    )}
                  >
                    <span className={cn("h-1 w-1 rounded-full", entry.connected ? "bg-lime-deep" : "bg-muted-light")} />
                    {entry.connected ? "ready" : "key needed"}
                  </span>
                  {selected && (
                    <span className="absolute right-1 top-1 grid h-3 w-3 place-items-center rounded-full bg-ink text-lime">
                      <Check size={7} strokeWidth={3.5} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-baseline justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-[.09em] text-ink/70">Model</h3>
            <span className="font-mono text-[8px] uppercase tracking-[.04em] text-muted">
              {currentProvider?.region} · {availableModels.length} options
            </span>
          </div>
          <div className="grid max-h-[212px] gap-1.5 overflow-y-auto pr-1 thin-scroll sm:grid-cols-2">
            {availableModels.map((entry) => {
              const selected = entry.id === model;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => {
                    setModel(entry.id);
                    setTested(false);
                  }}
                  aria-pressed={selected}
                  className={cn(
                    "flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition-all",
                    selected ? "border-ink bg-lime-soft/50 ring-1 ring-ink" : "border-line bg-paper hover:border-line-strong",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                      selected ? "border-ink bg-ink text-lime" : "border-line-strong",
                    )}
                  >
                    {selected && <Check size={9} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[11px] font-bold text-ink">{entry.name}</span>
                      {entry.badge && (
                        <span className="shrink-0 rounded-full bg-ink px-1.5 py-0.5 font-mono text-[6px] uppercase tracking-[.03em] text-lime">
                          {entry.badge}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-[8.5px] text-muted">{entry.tier}</span>
                    <span className="mt-1 flex items-center gap-2 font-mono text-[7px] uppercase tracking-[.02em] text-muted-light">
                      <span>{entry.context} ctx</span>
                      <span>{entry.latency}ms</span>
                      <span>${entry.inputCost}/{entry.outputCost} per M</span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <div className="flex items-baseline justify-between">
              <h3 className="text-[11px] font-bold uppercase tracking-[.09em] text-ink/70">Temperature</h3>
              <span className="rounded-md bg-bone-deep px-1.5 py-0.5 font-mono text-[9px] font-medium text-ink">
                {temperature.toFixed(1)}
              </span>
            </div>
            <div className="mt-2">
              <Slider
                value={temperature}
                min={0}
                max={1.2}
                step={0.1}
                onChange={(value) => setTemperature(value)}
                label={`${bot.name} temperature`}
              />
              <div className="flex justify-between font-mono text-[7.5px] uppercase tracking-[.04em] text-muted-light">
                <span>Precise</span>
                <span>Exploratory</span>
              </div>
            </div>
            <p className="mt-1.5 text-[9px] leading-relaxed text-muted">
              {temperature <= 0.35
                ? "Analytical range. Best for budget and engineering decisions."
                : temperature <= 0.7
                  ? "Balanced. Suitable for operations and staffing trade-offs."
                  : "High variance. Validate against the structured output contract."}
            </p>
          </div>
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[.09em] text-ink/70">Output contract</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {responseFormats.map((entry) => (
                <button
                  key={entry}
                  type="button"
                  onClick={() => setFormat(entry)}
                  aria-pressed={format === entry}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[9px] font-semibold transition-colors",
                    format === entry ? "border-ink bg-ink text-paper" : "border-line bg-paper text-muted hover:text-ink",
                  )}
                >
                  {entry}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[9px] leading-relaxed text-muted">
              Format is enforced with a JSON schema or table header. The bot must cite any budget assumption it makes.
            </p>
            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-sage/35 px-2 py-1.5 text-[8.5px] text-ink/70">
              <ShieldCheck size={10} className="text-sage-deep" />
              Prompt standards v3 · grounded · versioned
            </div>
          </div>
        </div>

        <div className="mt-5">
          <Field
            label="System prompt"
            htmlFor="system-prompt"
            hint={`${prompt.length} chars · ~${estimatedTokens} tokens`}
          >
            <textarea
              id="system-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={7}
              className={cn(inputClass, "resize-y font-mono text-[10px] leading-relaxed")}
              aria-describedby="prompt-hint"
            />
          </Field>
          <p id="prompt-hint" className="mt-1.5 flex items-start gap-1.5 text-[8.5px] leading-relaxed text-muted">
            <ShieldCheck size={10} className="mt-0.5 shrink-0 text-sage-deep" />
            Required: role, mission, explicit budget constraints, output contract, and escalation rule. Avoid vague qualifiers.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-bone/35 p-2.5">
          <Button
            variant={tested ? "soft" : "secondary"}
            size="sm"
            onClick={() => setTested(true)}
            disabled={!canSave}
          >
            <FlaskConical size={12} />
            {tested ? "Re-run sample" : "Test prompt"}
          </Button>
          <span className="flex-1 text-[8.5px] leading-tight text-muted">
            Test against <strong className="font-semibold text-ink">{selectedModel?.name ?? "a model"}</strong> at temp{" "}
            {temperature.toFixed(1)}. Sample is mocked for the demo.
          </span>
          <Badge tone="outline">
            <Sparkles size={8} />{selectedModel?.latency ?? 0}ms p50
          </Badge>
        </div>

        {tested && (
          <div className="mt-2 overflow-hidden rounded-xl border border-line bg-ink text-paper animate-fade">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
              <span className="font-mono text-[7.5px] uppercase tracking-[.1em] text-lime">Sample output · {format}</span>
              <span className="font-mono text-[7px] text-white/40">{selectedModel?.name} · not billed</span>
            </div>
            <pre className="thin-scroll max-h-[180px] overflow-auto px-3 py-2.5 font-mono text-[8.5px] leading-relaxed text-[#dbe9cf]">
              {testOutputs[bot.id]}
            </pre>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[.04em] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-deep" />
            Draft · unsaved
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              <X size={13} />
              Cancel
            </Button>
            <Button
              variant="lime"
              disabled={!canSave}
              onClick={() => {
                onSave({
                  provider,
                  model,
                  temperature,
                  systemPrompt: prompt.trim(),
                  responseFormat: format,
                });
              }}
            >
              <Check size={14} />
              Save &amp; deploy
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
