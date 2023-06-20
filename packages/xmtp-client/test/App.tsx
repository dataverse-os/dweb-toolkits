import { Buffer } from "buffer";
import "./App.css";
import XmtpTest from "./components/XmtpTest";

window.Buffer = Buffer;

function App() {
  return (
    <div className="App">
        <XmtpTest/>
    </div>
  );
}

export default App;
