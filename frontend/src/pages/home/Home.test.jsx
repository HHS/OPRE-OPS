import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test-utils";
import Home from "./Home";

vi.mock("../../helpers/featureFlags", () => ({
    isHomepageRedesignEnabled: vi.fn(() => false)
}));

import { isHomepageRedesignEnabled } from "../../helpers/featureFlags";

beforeEach(() => {
    vi.clearAllMocks();
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
        it("renders hero and tabs when flag is off", () => {
            isHomepageRedesignEnabled.mockReturnValue(false);
            renderWithProviders(<Home />);
            expect(screen.getByText("Plan, track & collaborate")).toBeInTheDocument();
            expect(screen.getByText("About OPS")).toBeInTheDocument();
        });

        it("renders only the routed outlet (no hero or legacy tabs) when flag is on", () => {
            isHomepageRedesignEnabled.mockReturnValue(true);
            renderWithProviders(<Home />);
            // The redesign layout drops the hero + legacy tabs; landing content (welcome
            // message, OPS Updates cards, tab nav) comes from HomeLanding via the routed
            // Outlet, not the Home layout itself.
            expect(screen.queryByText("Plan, track & collaborate")).not.toBeInTheDocument();
            expect(screen.queryByText("About OPS")).not.toBeInTheDocument();
            expect(screen.queryByTestId("welcome-message")).not.toBeInTheDocument();
        });
    });
});
