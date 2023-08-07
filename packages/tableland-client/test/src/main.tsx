import { Extension, DataverseConnector } from "@dataverse/dataverse-connector";
import React, { createContext } from 'react';
import ReactDOM from 'react-dom/client';
import './main.scss';
import App from './App';
import { WalletProvider } from "@dataverse/wallet-provider";
import { ModelParser, Output } from "@dataverse/model-parser";
import app from '../output/app.json';

interface Context {
  dataverseConnector: DataverseConnector;
  walletProvider: WalletProvider;
  modelParser: ModelParser;
}

export const Context = createContext<Context>({} as Context);
const dataverseConnector = new DataverseConnector();
const walletProvider = new WalletProvider();
const modelParser = new ModelParser(app as Output);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Context.Provider value={{ dataverseConnector, walletProvider, modelParser }}>
      <App />
    </Context.Provider>
  </React.StrictMode>
);
