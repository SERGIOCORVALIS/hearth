export type LatencySample = {
  tool: string;
  ms: number;
  at: string;
};

const samples: LatencySample[] = [];
const MAX = 50;

export function recordLatency(tool: string, ms: number): void {
  samples.push({ tool, ms, at: new Date().toISOString() });
  if (samples.length > MAX) samples.shift();
}

export async function timed<T>(tool: string, fn: () => Promise<T> | T): Promise<T> {
  const started = performance.now();
  try {
    return await fn();
  } finally {
    recordLatency(tool, Math.round(performance.now() - started));
  }
}

export function latencySummary() {
  if (samples.length === 0) {
    return {
      samples: 0,
      avgMs: null as number | null,
      maxMs: null as number | null,
      under500ms: true,
      recent: [] as LatencySample[],
    };
  }
  const values = samples.map((s) => s.ms);
  const avgMs = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const maxMs = Math.max(...values);
  return {
    samples: samples.length,
    avgMs,
    maxMs,
    under500ms: maxMs < 500,
    alexaPlusTargetMs: 500,
    recent: samples.slice(-8),
  };
}
