import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import FAQ from "./FAQ";

const LocationHashDisplay = () => {
    const location = useLocation();
    return <div data-testid="location-hash">{location.hash}</div>;
};

const renderWithRouter = (initialEntry = "/help-center/faq") => {
    render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
                <Route
                    path="/help-center/faq"
                    element={
                        <>
                            <FAQ />
                            <LocationHashDisplay />
                        </>
                    }
                />
            </Routes>
        </MemoryRouter>
    );
};

describe("FAQ Component", () => {
    it("renders FAQ title", () => {
        renderWithRouter();
        // Check the heading for FAQ section
        expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Frequently Asked Questions");
    });

    it("expands an FAQ item on click", async () => {
        renderWithRouter();
        const user = userEvent.setup();
        // Click the first FAQ accordion item (assumed to render as a button)
        const accordionButton = screen.getByRole("button", {
            name: /how do i learn how to use ops/i
        });
        await user.click(accordionButton);
        // Check that FAQ content appears after the accordion expands
        expect(screen.getByText(/you can learn how to use ops/i)).toBeInTheDocument();
    });

    it("opens matching accordion when URL hash is present", () => {
        renderWithRouter("/help-center/faq#how-do-i-learn-how-to-use-ops");

        const matchingAccordionButton = screen.getByRole("button", {
            name: /how do i learn how to use ops/i
        });

        expect(matchingAccordionButton).toHaveAttribute("aria-expanded", "true");
    });

    it("keeps accordions closed when URL hash does not match", () => {
        renderWithRouter("/help-center/faq#does-not-exist");

        const accordionButton = screen.getByRole("button", {
            name: /how do i learn how to use ops/i
        });

        expect(accordionButton).toHaveAttribute("aria-expanded", "false");
    });

    it("updates URL hash when an accordion is opened", async () => {
        renderWithRouter();
        const user = userEvent.setup();

        const accordionButton = screen.getByRole("button", {
            name: /how do i learn how to use ops/i
        });

        await user.click(accordionButton);

        expect(screen.getByTestId("location-hash")).toHaveTextContent("#how-do-i-learn-how-to-use-ops");
    });
});
