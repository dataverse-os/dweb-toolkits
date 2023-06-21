import { Buffer } from "buffer";
import "./App.css";
import React from "react";
import XmtpComponent from "./components/XmtpTest";

window.Buffer = Buffer;

function App() {
  return (
    <div className="App">
      <XmtpComponent/>
    </div>
  );
}

export default App;
