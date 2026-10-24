import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// Only the latin subset for the weights the UI actually uses — the full
// @fontsource/<family>/<weight>.css bundles pull in cyrillic/vietnamese/etc.
// that we never render.
import "@fontsource/hammersmith-one/latin-400.css";
import "@fontsource/montserrat/latin-400.css";
import "@fontsource/montserrat/latin-500.css";
import "@fontsource/montserrat/latin-600.css";
import "@fontsource/montserrat/latin-700.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
