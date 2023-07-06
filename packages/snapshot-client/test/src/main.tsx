import { Extension, DataverseConnector } from "@dataverse/dataverse-connector";
import React, { createContext } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.scss";

interface Context {
  dataverseConnector: DataverseConnector;
}

export const Context = createContext<Context>({} as Context);
const dataverseConnector = new DataverseConnector(Extension);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <Context.Provider value={{ dataverseConnector }}>
    <App />
  </Context.Provider>
);
