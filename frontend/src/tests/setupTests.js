import "@testing-library/jest-dom/vitest";
import { beforeAll, afterAll, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import ApplicationContext from "../applicationContext/ApplicationContext";
import TestApplicationContext from "../applicationContext/TestApplicationContext";
import { setupStore } from "../store";
import { server } from "./mocks";
import { opsApi } from "../api/opsAPI";
// jsdom 28 has native fetch support, so we don't need to use undici anymore
// The previous undici setup was causing issues with MSW in jsdom 28

const noop = () => {};
if (typeof window !== "undefined") {
    Object.defineProperty(window, "scrollTo", { value: noop, writable: true });
}

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
if (typeof document !== "undefined") {
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.appendChild(root);
}

const observe = vi.fn();

if (typeof window !== "undefined") {
    window.IntersectionObserver = vi.fn(function () {
        this.observe = observe;
    });
}

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
