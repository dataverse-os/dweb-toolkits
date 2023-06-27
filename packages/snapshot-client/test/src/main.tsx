import { Extension, RuntimeConnector } from "@dataverse/runtime-connector";
import React, { createContext } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

interface Context {
  runtimeConnector: RuntimeConnector;
}

export const Context = createContext<Context>({} as Context);
const runtimeConnector = new RuntimeConnector(Extension);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <Context.Provider value={{ runtimeConnector }}>
    <App />
  </Context.Provider>
);
