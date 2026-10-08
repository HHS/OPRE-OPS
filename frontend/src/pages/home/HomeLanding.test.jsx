import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test-utils";
import { __resetVisitSessionCache } from "../../helpers/visitSessionCache.helpers";
import HomeLanding from "./HomeLanding";

const storage = new Map();

beforeEach(() => {
    storage.clear();
    vi.clearAllMocks();
    localStorage.getItem.mockImplementation((key) => storage.get(key) ?? null);
    localStorage.setItem.mockImplementation((key, value) => storage.set(key, String(value)));
    localStorage.removeItem.mockImplementation((key) => storage.delete(key));
    localStorage.clear.mockImplementation(() => storage.clear());
    // These tests reuse user id 1 across cases; useWelcomeMessage caches its first/returning
    // classification at module scope, so reset it to keep cases independent.
    __resetVisitSessionCache();
});

describe("HomeLanding", () => {
    it("renders the tab nav with all three tab labels", () => {
        renderWithProviders(<HomeLanding />);

        expect(screen.getByText("What's New")).toBeInTheDocument();
        expect(screen.getByText("OPS at a Glance")).toBeInTheDocument();
        expect(screen.getByText("OPS Benefits")).toBeInTheDocument();
    });

    it("marks the What's New tab as selected by default", () => {
        renderWithProviders(<HomeLanding />);

        expect(screen.getByText("What's New").className).toContain("listItemSelected");
    });

    it("renders the welcome message as the page's single h1", () => {
        renderWithProviders(<HomeLanding />, {
            preloadedState: {
                auth: { activeUser: { id: 1, first_name: "Alex" }, isLoggedIn: true }
            }
        });

        const heading = screen.getByRole("heading", { level: 1 });
        expect(heading).toHaveTextContent("Welcome Alex");
    });

    it("renders a generic welcome when there is no first_name", () => {
        renderWithProviders(<HomeLanding />, {
            preloadedState: {
                auth: { activeUser: { id: 1, first_name: null }, isLoggedIn: true }
            }
        });

        expect(screen.getByTestId("welcome-message")).toHaveTextContent("Welcome!");
    });

    it("renders a 'Welcome back' greeting for a returning user", () => {
        storage.set("hasVisited_1", "true");
        renderWithProviders(<HomeLanding />, {
            preloadedState: {
                auth: { activeUser: { id: 1, first_name: "Alex" }, isLoggedIn: true }
            }
        });

        expect(screen.getByTestId("welcome-message")).toHaveTextContent("Welcome back Alex");
    });

    it("renders the OPS Updates summary cards", () => {
        renderWithProviders(<HomeLanding />);

        expect(screen.getByText("OPS Updates")).toBeInTheDocument();
        expect(screen.getByText("Currently Developing")).toBeInTheDocument();
    });
});
