import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@fontsource/hammersmith-one/400.css";
import "@fontsource/montserrat/300.css";
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
