import "@testing-library/jest-dom/vitest";
import { beforeAll, afterAll, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import ApplicationContext from "../applicationContext/ApplicationContext";
import TestApplicationContext from "../applicationContext/TestApplicationContext";
import { setupStore } from "../store";
import { server } from "./mocks";
import { opsApi } from "../api/opsAPI";
import {
    fetch as undiciFetch,
    Request as UndiciRequest,
    Response as UndiciResponse,
    Headers as UndiciHeaders
} from "undici";

// Use undici's fetch implementation to avoid AbortSignal compatibility issues with MSW
globalThis.fetch = undiciFetch;
globalThis.Request = UndiciRequest;
globalThis.Response = UndiciResponse;
globalThis.Headers = UndiciHeaders;

const noop = () => {};
Object.defineProperty(window, "scrollTo", { value: noop, writable: true });

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
};
global.localStorage = localStorageMock;

// Mock FontAwesome icons for proper rendering in tests
vi.mock("@fortawesome/react-fontawesome", () => ({
    FontAwesomeIcon: ({ icon, title, className, onClick, ...props }) => {
        // Extract icon name from the icon definition
        const iconName = icon?.iconName || title || "icon";
        return (
            <svg
                role="img"
                aria-label={title}
                className={className}
                onClick={onClick}
                data-icon={iconName}
                {...props}
            >
                <title>{title}</title>
            </svg>
        );
    }
}));

// Setup root element for react-modal
const root = document.createElement("div");
root.setAttribute("id", "root");
document.body.appendChild(root);

const observe = vi.fn();

window.IntersectionObserver = vi.fn(function () {
    this.observe = observe;
});

ApplicationContext.registerApplicationContext(TestApplicationContext);

const store = setupStore({});

beforeAll(() => {
    server.listen();
});

afterEach(() => {
    server.resetHandlers();
    store.dispatch(opsApi.util.resetApiState());
    cleanup();
});

afterAll(() => server.close());
