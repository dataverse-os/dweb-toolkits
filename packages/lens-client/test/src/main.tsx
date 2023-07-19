import { Extension, CoreConnector } from "@dataverse/core-connector";
import { ModelParser, Output } from "@dataverse/model-parser";
import React, { createContext } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.scss";
import app from "../output/app.json";

interface Context {
  coreConnector: CoreConnector;
  modelParser: ModelParser;
}

export const Context = createContext<Context>({} as Context);
const coreConnector = new CoreConnector(Extension);

const modelParser = new ModelParser(app as Output);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Context.Provider value={{ coreConnector, modelParser }}>
      <App />
    </Context.Provider>
  </React.StrictMode>
);
