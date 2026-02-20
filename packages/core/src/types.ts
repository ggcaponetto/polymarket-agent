export interface Market {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  endDate: string;
  liquidity: string;
  volume: string;
  active: boolean;
  closed: boolean;
  outcomes: string[];
  outcomePrices: string[];
  description: string;
  category: string;
  tags: string[];
  image: string;
}

export interface PolymarketEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  startDate: string;
  endDate: string;
  liquidity: number;
  volume: number;
  markets: Market[];
  active: boolean;
  closed: boolean;
  commentCount: number;
  image: string;
}

export interface FetchEventsOptions {
  active?: boolean;
  closed?: boolean;
  limit?: number;
  offset?: number;
}
