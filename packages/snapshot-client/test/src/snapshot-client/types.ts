export type ProposalType =
  | 'single-choice'
  | 'approval'
  | 'quadratic'
  | 'ranked-choice'
  | 'weighted'
  | 'basic';

export type Message = Proposal | Follow | Vote

export interface Proposal {
  from?: string;
  space: string;
  timestamp?: number;
  type: ProposalType;
  title: string;
  body: string;
  discussion: string;
  choices: string[];
  start: number;
  end: number;
  snapshot: number;
  plugins: string;
  app?: string;
}

export interface Follow {
  from?: string;
  space: string;
  timestamp?: number;
}

export interface Vote {
  from?: string;
  space: string;
  timestamp?: number;
  proposal: string;
  type: ProposalType;
  choice: number | number[] | string | { [key: string]: number };
  privacy?: string;
  reason?: string;
  app?: string;
  metadata?: string;
}

export interface Options {
  url?: string;
}

export interface Strategy {
  name: string;
  network: string;
  params: Record<string, unknown>;
}