import { Buffer } from "buffer";
import "./App.css";
import Runtime from "./components/RuntimeConnector";

window.Buffer = Buffer;

function App() {
  return (
    <div className="App">
        <Runtime/>
    </div>
  );
}

export default App;
