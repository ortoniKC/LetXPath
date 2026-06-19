import React from "react";
import ReactDOM from "react-dom/client";
import PanelApp from "./PanelApp";
import "../app/styles/main.css";
import "../app/styles/exp.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PanelApp />
  </React.StrictMode>,
);
