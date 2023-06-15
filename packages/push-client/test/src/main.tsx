import React, { createContext } from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Extension, RuntimeConnector } from '@dataverse/runtime-connector';

interface Context {
  runtimeConnector: RuntimeConnector;
}

export const Context = createContext<Context>({} as Context);
const runtimeConnector = new RuntimeConnector(Extension);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Context.Provider value={{ runtimeConnector }}>
      <App />
    </Context.Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
