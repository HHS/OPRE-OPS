import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import HowToGuides from "./HowToGuides";

const LocationHashDisplay = () => {
    const location = useLocation();
    return <div data-testid="location-hash">{location.hash}</div>;
};

const renderWithRouter = (initialEntry = "/help-center") => {
    render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
                <Route
                    path="/help-center"
                    element={
                        <>
                            <HowToGuides />
                            <LocationHashDisplay />
                        </>
                    }
                />
            </Routes>
        </MemoryRouter>
    );
};

describe("How-to Guides Page", () => {
    it("renders header and table of contents", () => {
        renderWithRouter();
        // Check header
        expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("How-to Guides");
    });

    it("expands accordion on click", async () => {
        renderWithRouter();
        // Assume the accordion heading renders as a button
        const accordionButton = screen.getByRole("button", { name: /how to find your user role/i });
        await userEvent.click(accordionButton);
        // Check if accordion content is displayed after click
        expect(screen.getByText(/click on your email address/i)).toBeInTheDocument();
    });

    it("opens matching accordion when URL hash is present", () => {
        renderWithRouter("/help-center#how-to-find-your-user-role");

        const accordionButton = screen.getByRole("button", { name: /how to find your user role/i });
        expect(accordionButton).toHaveAttribute("aria-expanded", "true");
    });

    it("keeps accordions closed when URL hash does not match", () => {
        renderWithRouter("/help-center#does-not-exist");

        const accordionButton = screen.getByRole("button", { name: /how to find your user role/i });
        expect(accordionButton).toHaveAttribute("aria-expanded", "false");
    });

    it("does not crash on malformed hash encoding", () => {
        renderWithRouter("/help-center#%E0%A4");

        expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("How-to Guides");
    });

    it("updates URL hash when an accordion is opened", async () => {
        renderWithRouter();

        const accordionButton = screen.getByRole("button", { name: /how to find your user role/i });
        await userEvent.click(accordionButton);

        expect(screen.getByTestId("location-hash")).toHaveTextContent("#how-to-find-your-user-role");
    });
});
