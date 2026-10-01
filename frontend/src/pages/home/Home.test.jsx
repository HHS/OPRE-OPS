import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test-utils";
import Home from "./Home";

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
});

describe("Home", () => {
    it("should render the hero heading", () => {
        renderWithProviders(<Home />);
        expect(screen.getByText("Plan, track & collaborate")).toBeInTheDocument();
    });

    it("should render the hero subheading", () => {
        renderWithProviders(<Home />);
        expect(screen.getByText("all in one place")).toBeInTheDocument();
    });

    it("should render the hero description", () => {
        renderWithProviders(<Home />);
        expect(
            screen.getByText(/OPS brings everyone together for transparent and collaborative budget planning/i)
        ).toBeInTheDocument();
    });

    it("should render the About OPS tab", () => {
        renderWithProviders(<Home />);
        expect(screen.getByText("About OPS")).toBeInTheDocument();
    });

    it("should render the Release Notes tab", () => {
        renderWithProviders(<Home />);
        expect(screen.getByText("Release Notes")).toBeInTheDocument();
    });

    it("should render the What's Next tab", () => {
        renderWithProviders(<Home />);
        expect(screen.getByText("What's Next")).toBeInTheDocument();
    });

    describe("feature flag: isHomepageRedesignEnabled", () => {
        it("does not render welcome message or cards when flag is off", () => {
            isHomepageRedesignEnabled.mockReturnValue(false);
            renderWithProviders(<Home />);
            expect(screen.queryByTestId("welcome-message")).not.toBeInTheDocument();
            expect(screen.queryByText("OPS Updates")).not.toBeInTheDocument();
            expect(screen.queryByText("Currently Developing")).not.toBeInTheDocument();
            expect(screen.getByText("Plan, track & collaborate")).toBeInTheDocument();
            expect(screen.getByText("About OPS")).toBeInTheDocument();
        });

        it("renders welcome message and cards when flag is on", () => {
            isHomepageRedesignEnabled.mockReturnValue(true);
            renderWithProviders(<Home />, {
                preloadedState: {
                    auth: { activeUser: { id: 1, first_name: "Alex" }, isLoggedIn: true }
                }
            });
            expect(screen.getByTestId("welcome-message")).toBeInTheDocument();
            expect(screen.getByText("OPS Updates")).toBeInTheDocument();
            expect(screen.getByText("Currently Developing")).toBeInTheDocument();
        });

        it("renders generic welcome when flag is on but no first_name", () => {
            isHomepageRedesignEnabled.mockReturnValue(true);
            renderWithProviders(<Home />, {
                preloadedState: {
                    auth: { activeUser: { id: 1, first_name: null }, isLoggedIn: true }
                }
            });
            expect(screen.getByTestId("welcome-message")).toHaveTextContent("Welcome");
        });

        it("renders 'Welcome back' greeting for a returning user", () => {
            storage.set("hasVisited_1", "true");
            isHomepageRedesignEnabled.mockReturnValue(true);
            renderWithProviders(<Home />, {
                preloadedState: {
                    auth: { activeUser: { id: 1, first_name: "Alex" }, isLoggedIn: true }
                }
            });
            expect(screen.getByTestId("welcome-message")).toHaveTextContent(/Welcome back/);
            storage.delete("hasVisited_1");
        });
    });
});
