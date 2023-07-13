import { Extension, CoreConnector } from "@dataverse/core-connector";
import React, { createContext } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.scss";

interface Context {
  coreConnector: CoreConnector;
}

export const Context = createContext<Context>({} as Context);
const coreConnector = new CoreConnector(Extension);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Context.Provider value={{ coreConnector }}>
      <App />
    </Context.Provider>
  </React.StrictMode>
);
