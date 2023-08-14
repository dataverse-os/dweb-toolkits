import React, { createContext } from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { DataverseConnector } from '@dataverse/dataverse-connector';
import app from '../output/app.json';
import { ModelParser, Output } from '@dataverse/model-parser';

interface Context {
  dataverseConnector: DataverseConnector;
  modelParser: ModelParser;
}

export const Context = createContext<Context>({} as Context);
const dataverseConnector = new DataverseConnector();
const modelParser = new ModelParser(app as Output);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Context.Provider value={{ dataverseConnector, modelParser }}>
      <App />
    </Context.Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
