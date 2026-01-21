import { setupWorker } from "msw/browser";
import { procurementHandlers } from "./handlers";

// This configures a Service Worker with the given request handlers.
export const worker = setupWorker(...procurementHandlers);

// Make the worker available in the browser console for debugging
window.msw = { worker };
