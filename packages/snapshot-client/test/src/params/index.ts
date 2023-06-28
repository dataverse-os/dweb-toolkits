import { Proposal, Vote, now } from "@dataverse/snapshot-client-toolkit";

export const ONE_DAY = 24 * 60 * 60;

export const test_proposal = {
  space: "toolkits.eth",
  type: "single-choice", // define the voting system
  title: "p_12",
  body: "proposal_p_12",
  choices: ["option01", "option02", "option03"],
  discussion: "",
  start: now(),
  end: now() + ONE_DAY,
  snapshot: 17561820,
  plugins: JSON.stringify({}),
  app: "my-app-01", // provide the name of your project which is using this snapshot.js integration
} as Proposal;

export const test_space = "toolkits.eth";

export const test_space_obj = {
  space: test_space,
};

export const test_vote = {
  space: "toolkits.eth",
  proposal:
    "0xb3df03c9b6ee68fa5bf9da05e0b1ebc826ef554781755b3edaf32d821c860b66",
  type: "single-choice",
  choice: 1,
  reason: "Choice 1 make lot of sense",
  app: "my-app",
} as Vote;

/*0x0a5ab7b94b7f1b4d98adefa9eb63af0d8177ebbaabd2a8ee1b2565edf7d80ce5*/

export const test_vote_receipt = {
  id: "0x1cf7ebaa0678676bba9fdde7dc0b5670fec219a49cedf40e3a70f1a76bb9a39d",
  ipfs: "bafkreib42u2hwuya3adm5paf6uvknwoo6xssl3paxjedq2jjiv4mvbjhiy",
  relayer: {
    address: "0x8BBE4Ac64246d600BC2889ef5d83809D138F03DF",
    receipt:
      "0xf1a3b1bad0ba31193df80ea3f5dd7b283621d97d680280903940fb5c25fec02c3929342551da621d0789c899feee24d5313d8c440245f7c2d53145095287ade51c",
  },
};

export const test_create_proposal_receipt = {
  id: "0xdafc511e75752078042d176822edcae4ff63ec01a4920045d26fc27836ea8855",
  ipfs: "bafkreibdf47iadcmbpgt3q2ary45dto3gh3tpqiod6stakzhjfaqzlbeei",
  relayer: {
    address: "0x8BBE4Ac64246d600BC2889ef5d83809D138F03DF",
    receipt:
      "0x616804e85bbebcc80aa5930e5757e04a6215ff56448545c94a8f2c84f05da5aa23296dfb2349d6491dc531760c52eaedc48f208c55c4903ccd1dc6eb30dfb4ba1b",
  },
};

export const test_query_proposal_by_id = {
  id: "0xdafc511e75752078042d176822edcae4ff63ec01a4920045d26fc27836ea8855",
  title: "p_05",
  body: "proposal_p_05",
  choices: ["option01", "option02", "option03"],
  start: 1687835057,
  end: 1687921457,
  snapshot: "17561820",
  state: "active",
  scores: [],
  scores_by_strategy: [],
  scores_total: 0,
  scores_updated: 0,
  author: "0xb5AB443DfF53F0e397a9E0778A3343Cbaf4D001a",
  space: {
    id: "toolkits.eth",
    name: "toolkits",
  },
};
