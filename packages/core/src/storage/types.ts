export interface MarketAnalysis {
  marketId: string;
  question: string;
  currentPrice: { yes: number; no: number };
  estimatedProbability: number;
  edge: number;
  confidence: 'low' | 'medium' | 'high';
  sources: string[];
  reasoning: string;
}

export interface EventResearch {
  eventId: string;
  title: string;
  timestamp: string;
  markets: MarketAnalysis[];
  action: 'BUY_YES' | 'BUY_NO' | 'HOLD' | 'SELL' | 'SKIP';
  actionReasoning: string;
  riskLevel: 'low' | 'medium' | 'high';
  /** Agent-generated summary of web research and key findings */
  researchSummary?: string;
  /** Agent identifier that produced this research */
  analyst?: string;
}

export interface EventSnapshot {
  timestamp: string;
  eventCount: number;
  events: import('../types.js').PolymarketEvent[];
}

export interface ActionRecommendation {
  eventId: string;
  title: string;
  action: EventResearch['action'];
  actionReasoning: string;
  topEdge: number;
  confidence: MarketAnalysis['confidence'];
  riskLevel: EventResearch['riskLevel'];
  timestamp: string;
}

export interface DailyActions {
  timestamp: string;
  recommendations: ActionRecommendation[];
}
