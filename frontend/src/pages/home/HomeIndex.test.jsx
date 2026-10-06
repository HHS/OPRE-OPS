import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test-utils";
import { __resetVisitSessionCache } from "../../helpers/visitSessionCache.helpers";
import HomeIndex from "./HomeIndex";

vi.mock("../../helpers/featureFlags", () => ({
    isHomepageRedesignEnabled: vi.fn(() => false)
}));

import { isHomepageRedesignEnabled } from "../../helpers/featureFlags";

const storage = new Map();

beforeEach(() => {
    storage.clear();
    vi.clearAllMocks();
    localStorage.getItem.mockImplementation((key) => storage.get(key) ?? null);
    localStorage.setItem.mockImplementation((key, value) => storage.set(key, String(value)));
    localStorage.removeItem.mockImplementation((key) => storage.delete(key));
    localStorage.clear.mockImplementation(() => storage.clear());
    isHomepageRedesignEnabled.mockReturnValue(false);
    // These tests reuse user id 1 across cases; useWelcomeMessage caches its first/returning
    // classification at module scope, so reset it to keep cases independent.
    __resetVisitSessionCache();
});

describe("HomeIndex", () => {
    it("renders the legacy benefits grid when the flag is off", () => {
        isHomepageRedesignEnabled.mockReturnValue(false);
        renderWithProviders(<HomeIndex />);
        expect(screen.getByText("OPS Benefits")).toBeInTheDocument();
        expect(screen.queryByTestId("welcome-message")).not.toBeInTheDocument();
    });

    it("renders the redesigned landing (welcome + cards) when the flag is on", () => {
        isHomepageRedesignEnabled.mockReturnValue(true);
        renderWithProviders(<HomeIndex />, {
            preloadedState: {
                auth: { activeUser: { id: 1, first_name: "Alex" }, isLoggedIn: true }
            }
        });
        expect(screen.getByTestId("welcome-message")).toHaveTextContent("Welcome Alex");
        expect(screen.getByText("OPS Updates")).toBeInTheDocument();
        expect(screen.getByText("Currently Developing")).toBeInTheDocument();
        expect(screen.queryByText("OPS Benefits")).not.toBeInTheDocument();
    });

    it("renders a generic welcome when the flag is on but there is no first_name", () => {
        isHomepageRedesignEnabled.mockReturnValue(true);
        renderWithProviders(<HomeIndex />, {
            preloadedState: {
                auth: { activeUser: { id: 1, first_name: null }, isLoggedIn: true }
            }
        });
        expect(screen.getByTestId("welcome-message")).toHaveTextContent("Welcome!");
    });

    it("renders a 'Welcome back' greeting for a returning user", () => {
        storage.set("hasVisited_1", "true");
        isHomepageRedesignEnabled.mockReturnValue(true);
        renderWithProviders(<HomeIndex />, {
            preloadedState: {
                auth: { activeUser: { id: 1, first_name: "Alex" }, isLoggedIn: true }
            }
        });
        expect(screen.getByTestId("welcome-message")).toHaveTextContent("Welcome back Alex");
    });
});
