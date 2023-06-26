import snapshot from '@snapshot-labs/snapshot.js';
import {SNAP_SHOT_HUB} from "./constants";

import { Web3Provider } from '@ethersproject/providers';
import {Signer, Wallet} from "ethers";
import {RuntimeConnector} from "@dataverse/runtime-connector";
import {ONE_DAY} from "./constants";
export const snapshotClient = new snapshot.Client712(SNAP_SHOT_HUB.dev);





