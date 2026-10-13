export type Sentiment = 'Positive' | 'Neutral' | 'Negative' | 'Unknown';

/** Trimmed-down call record sent to the browser (heavy fields stripped). */
export interface LeanCall {
  id: string;
  type?: string;
  agent_id: string;
  agent_name?: string;
  status: 'registered' | 'not_connected' | 'ongoing' | 'ended' | 'error' | string;
  start?: number;
  end?: number;
  duration_ms: number;
  reason?: string;
  cost_cents: number;
  from?: string;
  to?: string;
  direction?: string;
  batch_call_id?: string;
  sentiment?: Sentiment | string;
  successful?: boolean;
  voicemail?: boolean;
  summary?: string;
  custom?: Record<string, unknown>;
  vars?: Record<string, string>;
  latency_p50?: number;
}

export interface CallDetail extends LeanCall {
  analysis?: { custom_analysis_data?: Record<string, unknown> } & Record<string, unknown>;
  recording_url?: string;
  transcript: { role: string; content: string; at?: number }[];
  cost_breakdown?: { product: string; cost: number }[];
}

export interface Agent {
  agent_id: string;
  agent_name: string;
  voice_name?: string;
  voice_avatar_url?: string;
  published_version?: number;
}

export interface PhoneNumber {
  phone_number: string;
  pretty: string;
  nickname?: string;
  outbound_agent_id?: string;
}

export interface Concurrency {
  current_concurrency: number;
  concurrency_limit: number;
}

export interface DashboardConfig {
  agents: Agent[];
  phoneNumbers: PhoneNumber[];
  concurrency: Concurrency | null;
  restricted: boolean;
}

export interface CallTimeWindow {
  windows: { start: number; end: number }[];
  timezone: string;
  day?: string[];
}

export interface Batch {
  batch_call_id: string;
  name: string;
  from_number: string;
  agent_id: string | null;
  agent_name: string | null;
  total: number;
  skipped: number;
  scheduled_at: number;
  created_at: number;
  window: CallTimeWindow | null;
  // Live stats (only on recent batches)
  placed?: number;
  ended?: number;
  ongoing?: number;
  not_connected?: number;
  successful?: number;
  cost_cents?: number;
  statsError?: boolean;
}
