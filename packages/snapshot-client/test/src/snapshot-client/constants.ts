import {Proposal, Vote} from "./types";

export const SNAP_SHOT_HUB = {
  "prod": 'https://hub.snapshot.org',
  "dev": 'https://testnet.snapshot.org'
};

export const GRAPHQL_API = {
  "prod": 'https://hub.snapshot.org/graphql',
  "dev": 'https://testnet.snapshot.org/graphql'
}

export const ONE_DAY = 24 * 60 * 60;

export const now = Number((new Date().getTime() / 1000).toFixed(0));

export const test_proposal = {
  space: 'toolkits.eth',
  type: 'single-choice', // define the voting system
  title: 'p_04',
  body: 'proposal_p_04',
  choices: ['option01', 'option02', 'option03'],
  discussion: "",
  start: now,
  end: now + ONE_DAY,
  snapshot: 17561820,
  plugins: JSON.stringify({}),
  app: 'my-app' // provide the name of your project which is using this snapshot.js integration
} as Proposal;

export const test_ens = "toolkits.eth"

export const test_space = {
  space: test_ens
}

export const test_vote =
  {
    space: 'toolkits.eth',
    proposal: '0x7183b5e162a652e87487192f1bec67f2bc858a3cbb8218e3ed1fc573f81e5ccd',
    type: 'single-choice',
    choice: 1,
    reason: 'Choice 1 make lot of sense',
    app: 'my-app'
  } as Vote;
