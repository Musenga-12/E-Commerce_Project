import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { i18nReady } from "./i18n";
import "./index.css";

// Wait for the visitor's language so the first paint is already translated.
i18nReady.finally(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
