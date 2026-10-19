import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActionRail } from "./ActionRail";
import { FALLBACK_HOUSEHOLDS, FALLBACK_SCENARIOS } from "./constants";
import { isDemoFast, runDemoSteps, shouldAutoStartDemo, type DemoStep } from "./demoPlayer";
import { JudgeDrawer } from "./JudgeDrawer";
import { LiveToolsStrip } from "./LiveToolsStrip";
import { McpCoverageBar } from "./McpCoverageBar";
import { getSpeechRecognition, type SpeechRecognitionLike } from "./speech";
import { ShowStage } from "./ShowStage";
import { TopChrome } from "./TopChrome";
import type {
  ChatMessage,
  EveningState,
  Health,
  KnowledgeHit,
  McpCoverage,
  PlanCard,
  PlanOption,
  SurfaceCall,
  ToolCall,
  VisualCard,
} from "./types";

export function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Good evening. I'm Hearth on your Alexa+ display — tap a home, or Play full demo to tour every MCP tool, resource, and prompt.",
    },
  ]);
  const [input, setInput] = useState(FALLBACK_SCENARIOS[0].examplePrompt);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoStepLabel, setDemoStepLabel] = useState<string | null>(null);
  const [demoStepIndex, setDemoStepIndex] = useState(0);
  const [demoStepTotal, setDemoStepTotal] = useState(0);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [surfaceCalls, setSurfaceCalls] = useState<SurfaceCall[]>([]);
  const [mcpCoverage, setMcpCoverage] = useState<McpCoverage | null>(null);
  const [planCard, setPlanCard] = useState<PlanCard | null>(null);
  const [visualCard, setVisualCard] = useState<VisualCard | null>(null);
  const [planOptions, setPlanOptions] = useState<PlanOption[]>([]);
  const [eveningState, setEveningState] = useState<EveningState | null>(null);
  const [knowledgeHits, setKnowledgeHits] = useState<KnowledgeHit[]>([]);
  const [awsServices, setAwsServices] = useState<string[]>([]);
  const [lastMode, setLastMode] = useState<"offline" | "bedrock" | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [scenarioId, setScenarioId] = useState("weekend");
  const [householdId, setHouseholdId] = useState("rivera");
  const [turnLatencyMs, setTurnLatencyMs] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const demoLock = useRef(false);
  const busyRef = useRef(false);

  const scenarios = health?.scenarios?.length ? health.scenarios : FALLBACK_SCENARIOS;
  const households = health?.households?.length ? health.households : FALLBACK_HOUSEHOLDS;
  const voiceSupported = Boolean(getSpeechRecognition());
  const householdLabel =
    households.find((h) => h.id === householdId)?.label ??
    eveningState?.householdName ??
    "Family evening";
  const latestReply = [...messages].reverse().find((m) => m.role === "assistant")?.text ?? null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/health");
        const data = (await res.json()) as Health;
        if (!cancelled) setHealth(data);
      } catch (error) {
        if (!cancelled) {
          setHealth({
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const statusPills = useMemo(() => {
    if (!health) return [{ label: "Connecting…", value: "…", kind: "" }];
    const latencyValue =
      turnLatencyMs != null
        ? `${turnLatencyMs}ms`
        : health.latency?.avgMs != null
          ? `avg ${health.latency.avgMs}ms`
          : "—";
    const latencyOk =
      turnLatencyMs != null ? turnLatencyMs < 500 : Boolean(health.latency?.under500ms);
    return [
      { label: "MCP", value: health.ok ? "connected" : "down", kind: health.ok ? "ok" : "bad" },
      { label: "Protocol", value: health.mcp?.protocolVersion ?? "—", kind: "ok" },
      {
        label: "Agent",
        value: health.agent ?? "—",
        kind: health.agent === "bedrock" ? "ok" : "",
      },
      {
        label: "Latency",
        value: latencyValue,
        kind: latencyOk ? "ok" : turnLatencyMs != null ? "bad" : "",
      },
    ];
  }, [health, turnLatencyMs]);

  const send = useCallback(
    async (text: string, opts?: { scenario?: string; household?: string }) => {
      const message = text.trim();
      if (!message || busyRef.current) return;

      const scenario = opts?.scenario ?? scenarioId;
      const household = opts?.household ?? householdId;

      busyRef.current = true;
      setBusy(true);
      setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text: message }]);
      setInput("");

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, scenario, household }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Chat request failed");

        const nextTools = (data.toolCalls as ToolCall[]) ?? [];
        const nextSurface = (data.surfaceCalls as SurfaceCall[]) ?? [];
        if (demoLock.current) {
          setToolCalls((prev) => [...prev, ...nextTools]);
          if (nextSurface.length > 0) {
            setSurfaceCalls((prev) => [...prev, ...nextSurface]);
          }
        } else {
          setToolCalls(nextTools);
          if (nextSurface.length > 0) setSurfaceCalls(nextSurface);
        }
        if (data.mcpCoverage) {
          setMcpCoverage(data.mcpCoverage as McpCoverage);
        }
        setPlanCard((data.planCard as PlanCard) ?? null);
        setVisualCard((data.visualCard as VisualCard) ?? null);
        setPlanOptions((data.planOptions as PlanOption[]) ?? []);
        setEveningState((data.eveningState as EveningState) ?? null);
        setKnowledgeHits((data.knowledgeHits as KnowledgeHit[]) ?? []);
        setAwsServices((data.awsServices as string[]) ?? []);
        setLastMode(data.mode ?? null);
        setTurnLatencyMs(typeof data.latencyMs === "number" ? data.latencyMs : null);
        if (data.toolLatency) {
          setHealth((h) => (h ? { ...h, latency: data.toolLatency } : h));
        }
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            text: data.reply,
            mode: data.mode,
          },
        ]);
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: "assistant",
            text: `Something went wrong: ${error instanceof Error ? error.message : String(error)}`,
          },
        ]);
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [scenarioId, householdId],
  );

  const runDemo = useCallback(async () => {
    if (demoLock.current || busyRef.current) return;
    demoLock.current = true;
    setDemoRunning(true);
    setDemoStepLabel("Starting full-surface demo…");
    setDemoStepIndex(0);
    setSurfaceCalls([]);
    setToolCalls([]);
    setMcpCoverage(null);
    const fast = isDemoFast(window.location.search);
    try {
      const scriptRes = await fetch(`/api/demo-script${fast ? "?fast=1" : ""}`);
      const script = (await scriptRes.json()) as { steps: DemoStep[] };
      setDemoStepTotal(script.steps.length);
      await runDemoSteps(script.steps, send, {
        betweenStepsMs: fast ? 80 : 1400,
        onStep: (step, index) => {
          setHouseholdId(step.household);
          setScenarioId(step.scenario);
          setInput(step.message);
          setDemoStepIndex(index + 1);
          setDemoStepLabel(step.label ?? `${step.household} · ${step.scenario}`);
        },
      });
    } finally {
      setDemoRunning(false);
      setDemoStepLabel(null);
      demoLock.current = false;
    }
  }, [send]);

  useEffect(() => {
    if (!shouldAutoStartDemo(window.location.search)) return;
    const delay = isDemoFast(window.location.search) ? 200 : 900;
    const t = window.setTimeout(() => {
      void runDemo();
    }, delay);
    return () => window.clearTimeout(t);
  }, [runDemo]);

  function exploreHousehold(id: string) {
    if (busyRef.current || demoLock.current) return;
    setHouseholdId(id);
    const scenario = scenarios.find((s) => s.id === scenarioId);
    const prompt =
      scenario?.examplePrompt ?? "Plan a low-key evening for everyone in this household";
    setInput(prompt);
    void send(prompt, { household: id, scenario: scenarioId });
  }

  function exploreScenario(id: string) {
    if (busyRef.current || demoLock.current) return;
    setScenarioId(id);
    const scenario = scenarios.find((s) => s.id === id);
    if (!scenario) return;
    setInput(scenario.examplePrompt);
    void send(scenario.examplePrompt, { scenario: id, household: householdId });
  }

  function toggleVoice() {
    const Ctor = getSpeechRecognition();
    if (!Ctor) return;
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }
    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript) setInput(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <div className="app-stage">
      <TopChrome
        statusPills={statusPills}
        lastMode={lastMode}
        households={households}
        householdId={householdId}
        onHousehold={exploreHousehold}
        scenarios={scenarios}
        scenarioId={scenarioId}
        onScenario={exploreScenario}
        demoRunning={demoRunning}
        busy={busy}
        onPlayDemo={() => void runDemo()}
        demoStepLabel={demoStepLabel}
        demoStepIndex={demoStepIndex}
        demoStepTotal={demoStepTotal}
      />

      <ActionRail busy={busy} demoRunning={demoRunning} onAction={(prompt) => void send(prompt)} />

      <ShowStage
        planCard={planCard}
        visualCard={visualCard}
        planOptions={planOptions}
        eveningState={eveningState}
        latestReply={latestReply}
        messages={messages}
        input={input}
        onInput={setInput}
        onSend={() => void send(input)}
        onToggleVoice={toggleVoice}
        busy={busy}
        demoRunning={demoRunning}
        listening={listening}
        voiceSupported={voiceSupported}
        lastMode={lastMode}
        householdLabel={householdLabel}
        onSwitchPlan={(planId) => void send(`Switch to plan ${planId}`)}
        onCareCheckin={() =>
          void send("Log a care check-in for our elder and tell me how they're doing")
        }
        onReminder={() => void send("Set a reminder for wind-down in 20 minutes")}
        bottomRef={bottomRef}
      />

      <McpCoverageBar coverage={mcpCoverage} toolCalls={toolCalls} surfaceCalls={surfaceCalls} />

      <LiveToolsStrip toolCalls={toolCalls} latencyMs={turnLatencyMs} />

      <JudgeDrawer
        toolCalls={toolCalls}
        surfaceCalls={surfaceCalls}
        eveningState={eveningState}
        knowledgeHits={knowledgeHits}
        awsServices={awsServices}
        lastMode={lastMode}
        forceOpen={demoRunning || Boolean(mcpCoverage)}
      />
    </div>
  );
}
