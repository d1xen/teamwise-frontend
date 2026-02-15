import ReactDOM from "react-dom/client";
import { AppProviders } from "@/app/providers";

import "./styles/globals.css";
import "./i18n";

ReactDOM.createRoot(document.getElementById("root")!).render(<AppProviders />);
