export type ModelId = string;

export interface ModelOption {
  id: ModelId;
  name: string;
  label: string;
  provider: string;
  badge: string;
  badgeColor: string;
}

export type StageId =
  | 'idle'
  | 'connecting'
  | 'authenticating'
  | 'sending-request'
  | 'receiving-response'
  | 'parsing-stream'
  | 'analyzing-latency'
  | 'checking-safety'
  | 'complete';

export interface StageInfo {
  id: StageId;
  label: string;
  description: string;
}

export type IssueLevel = 'critical' | 'warning' | 'info' | 'healthy';

export interface DetectionIssue {
  level: IssueLevel;
  title: string;
  detail: string;
  metric?: string;
}

export interface LatencyBreakdown {
  dns: number;
  tcp: number;
  tls: number;
  firstByte: number;
  streamDuration: number;
  total: number;
}

export interface SafetyCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  detail: string;
}

export interface StreamChunk {
  index: number;
  content: string;
  latencyMs: number;
}

export interface DetectionResult {
  model: ModelId;
  endpoint: string;
  apiKeyMasked: string;
  timestamp: string;
  status: 'healthy' | 'degraded' | 'critical';
  overallScore: number;
  latency: LatencyBreakdown;
  streamChunks: StreamChunk[];
  safetyChecks: SafetyCheck[];
  issues: DetectionIssue[];
  responsePreview: string;
  tokensIn: number;
  tokensOut: number;
}

export type DetectionStatus = 'idle' | 'running' | 'done' | 'error';

export interface DetectionState {
  status: DetectionStatus;
  currentStage: StageId;
  stageProgress: number;
  result: DetectionResult | null;
  error: string | null;
}

/** 单个模型探测后的轻量摘要（由 Gateway /doctor/probe results 映射） */
export interface ProbedModelResult {
  model: string;
  status: 'healthy' | 'degraded' | 'down';
  grade: 'A' | 'B' | 'F';
  chatOk: boolean;
  sseOk: boolean;
  chatLatencyMs: number;
  firstByteMs: number | null;
  chunks: number;
  chatPreview: string;
  errorCode: string;
  errorMessage: string;
}

/** 一次完整检测的报告摘要（可跨多模型） */
export interface DetectionReport {
  endpoint: string;
  baseUrl: string;
  apiKeyMasked: string;
  timestamp: string;
  score: number;
  healthyCount: number;
  degradedCount: number;
  downCount: number;
  modelCount: number;
  models: ProbedModelResult[];
  /** 协议（openai/anthropic/gemini/mistral/cohere），用于生成接入模板 */
  protocol?: string;
}
