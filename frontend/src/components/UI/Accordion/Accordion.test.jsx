import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import Accordion from "./Accordion";

/* eslint-disable testing-library/no-container, testing-library/no-node-access */
// Note: Using container.querySelector is necessary for testing className changes
// on the accordion wrapper div, which doesn't have accessible queries available

describe("Accordion Component", () => {
    const defaultProps = {
        heading: "Test Accordion Heading",
        children: <div>Test accordion content</div>
    };

    describe("Initial State", () => {
        it("renders open by default when isClosed is false", () => {
            const { container } = render(
                <Accordion
                    {...defaultProps}
                    isClosed={false}
                />
            );

            const button = screen.getByRole("button", { name: defaultProps.heading });
            const accordionDiv = container.querySelector(".usa-accordion");

            expect(button).toHaveAttribute("aria-expanded", "true");
            expect(accordionDiv).toHaveClass("padding-bottom-6");
        });

        it("renders closed by default when isClosed is true", () => {
            const { container } = render(
                <Accordion
                    {...defaultProps}
                    isClosed={true}
                />
            );

            const button = screen.getByRole("button", { name: defaultProps.heading });
            const accordionDiv = container.querySelector(".usa-accordion");

            expect(button).toHaveAttribute("aria-expanded", "false");
            expect(accordionDiv).not.toHaveClass("padding-bottom-6");
        });

        it("renders open by default when isClosed prop is not provided", () => {
            render(<Accordion {...defaultProps} />);

            const button = screen.getByRole("button", { name: defaultProps.heading });

            expect(button).toHaveAttribute("aria-expanded", "true");
        });
    });

    describe("User Interaction", () => {
        it("toggles from open to closed when button is clicked", async () => {
            const user = userEvent.setup();
            const { container } = render(
                <Accordion
                    {...defaultProps}
                    isClosed={false}
                />
            );

            const button = screen.getByRole("button", { name: defaultProps.heading });
            const accordionDiv = container.querySelector(".usa-accordion");

            // Initially open
            expect(button).toHaveAttribute("aria-expanded", "true");
            expect(accordionDiv).toHaveClass("padding-bottom-6");

            // Click to close
            await user.click(button);

            expect(button).toHaveAttribute("aria-expanded", "false");
            expect(accordionDiv).not.toHaveClass("padding-bottom-6");
        });

        it("toggles from closed to open when button is clicked", async () => {
            const user = userEvent.setup();
            const { container } = render(
                <Accordion
                    {...defaultProps}
                    isClosed={true}
                />
            );

            const button = screen.getByRole("button", { name: defaultProps.heading });
            const accordionDiv = container.querySelector(".usa-accordion");

            // Initially closed
            expect(button).toHaveAttribute("aria-expanded", "false");
            expect(accordionDiv).not.toHaveClass("padding-bottom-6");

            // Click to open
            await user.click(button);

            expect(button).toHaveAttribute("aria-expanded", "true");
            expect(accordionDiv).toHaveClass("padding-bottom-6");
        });

        it("toggles multiple times correctly", async () => {
            const user = userEvent.setup();
            const { container } = render(<Accordion {...defaultProps} />);

            const button = screen.getByRole("button", { name: defaultProps.heading });
            const accordionDiv = container.querySelector(".usa-accordion");

            // Initially open
            expect(button).toHaveAttribute("aria-expanded", "true");
            expect(accordionDiv).toHaveClass("padding-bottom-6");

            // Click to close
            await user.click(button);
            expect(button).toHaveAttribute("aria-expanded", "false");
            expect(accordionDiv).not.toHaveClass("padding-bottom-6");

            // Click to open
            await user.click(button);
            expect(button).toHaveAttribute("aria-expanded", "true");
            expect(accordionDiv).toHaveClass("padding-bottom-6");

            // Click to close again
            await user.click(button);
            expect(button).toHaveAttribute("aria-expanded", "false");
            expect(accordionDiv).not.toHaveClass("padding-bottom-6");
        });
    });

    describe("Accessibility", () => {
        it("updates aria-expanded to match visual state on toggle", async () => {
            const user = userEvent.setup();
            const { container } = render(
                <Accordion
                    {...defaultProps}
                    isClosed={true}
                />
            );

            const button = screen.getByRole("button", { name: defaultProps.heading });
            const accordionDiv = container.querySelector(".usa-accordion");

            // Verify initial accessibility state
            expect(button).toHaveAttribute("aria-expanded", "false");
            expect(accordionDiv).not.toHaveClass("padding-bottom-6");

            // Toggle open
            await user.click(button);

            // Verify accessibility state matches new visual state
            expect(button).toHaveAttribute("aria-expanded", "true");
            expect(accordionDiv).toHaveClass("padding-bottom-6");

            // Toggle closed
            await user.click(button);

            // Verify accessibility state matches visual state again
            expect(button).toHaveAttribute("aria-expanded", "false");
            expect(accordionDiv).not.toHaveClass("padding-bottom-6");
        });

        it("has correct aria-controls attribute", () => {
            render(<Accordion {...defaultProps} />);

            const button = screen.getByRole("button", { name: defaultProps.heading });
            const ariaControls = button.getAttribute("aria-controls");

            // Find content div by its id
            const contentDiv = screen.getByText("Test accordion content").closest(".usa-accordion__content");

            expect(ariaControls).toBeTruthy();
            expect(contentDiv).toHaveAttribute("id", ariaControls);
        });
    });

    describe("Uncontrolled Behavior", () => {
        it("does not respond to isClosed prop changes after mount (uncontrolled)", async () => {
            const user = userEvent.setup();
            const { rerender } = render(
                <Accordion
                    {...defaultProps}
                    isClosed={true}
                />
            );

            const button = screen.getByRole("button", { name: defaultProps.heading });

            // Initially closed
            expect(button).toHaveAttribute("aria-expanded", "false");

            // User opens the accordion
            await user.click(button);
            expect(button).toHaveAttribute("aria-expanded", "true");

            // Parent tries to close it by changing the prop - should have no effect
            rerender(
                <Accordion
                    {...defaultProps}
                    isClosed={true}
                />
            );

            // Should still be open (uncontrolled)
            expect(button).toHaveAttribute("aria-expanded", "true");
        });

        it("only uses isClosed prop for initial state", () => {
            const { rerender } = render(
                <Accordion
                    {...defaultProps}
                    isClosed={false}
                />
            );

            const button = screen.getByRole("button", { name: defaultProps.heading });

            // Initially open
            expect(button).toHaveAttribute("aria-expanded", "true");

            // Change prop - should have no effect
            rerender(
                <Accordion
                    {...defaultProps}
                    isClosed={true}
                />
            );

            // Should still be open
            expect(button).toHaveAttribute("aria-expanded", "true");
        });
    });

    describe("Heading Level", () => {
        it("renders with custom heading level", () => {
            render(
                <Accordion
                    {...defaultProps}
                    level={2}
                />
            );

            const heading = screen.getByRole("heading", { level: 2 });
            expect(heading).toBeInTheDocument();
            expect(heading).toHaveTextContent(defaultProps.heading);
        });

        it("defaults to h4 when level is not provided", () => {
            render(<Accordion {...defaultProps} />);

            const heading = screen.getByRole("heading", { level: 4 });
            expect(heading).toBeInTheDocument();
        });

        it("throws error for invalid heading level", () => {
            // Suppress console.error for this test
            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

            expect(() => {
                render(
                    <Accordion
                        {...defaultProps}
                        level={7}
                    />
                );
            }).toThrow("Unrecognized heading level: 7");

            expect(() => {
                render(
                    <Accordion
                        {...defaultProps}
                        level={0}
                    />
                );
            }).toThrow("Unrecognized heading level: 0");

            consoleSpy.mockRestore();
        });
    });

    describe("Data Attributes", () => {
        it("applies data-cy attribute when provided", () => {
            const { container } = render(
                <Accordion
                    {...defaultProps}
                    dataCy="test-accordion"
                />
            );

            const accordion = container.querySelector('[data-cy="test-accordion"]');
            expect(accordion).toBeInTheDocument();
            expect(accordion).toHaveClass("usa-accordion");
        });

        it("applies id attribute when provided", () => {
            const { container } = render(
                <Accordion
                    {...defaultProps}
                    id="test-anchor-id"
                />
            );

            const accordion = container.querySelector("#test-anchor-id");
            expect(accordion).toBeInTheDocument();
            expect(accordion).toHaveClass("usa-accordion");
        });
    });

    describe("Callbacks", () => {
        it("calls onToggle with next open state", async () => {
            const user = userEvent.setup();
            const onToggle = vi.fn();

            render(
                <Accordion
                    {...defaultProps}
                    isClosed={true}
                    onToggle={onToggle}
                />
            );

            const button = screen.getByRole("button", { name: defaultProps.heading });

            await user.click(button);
            await user.click(button);

            expect(onToggle).toHaveBeenNthCalledWith(1, true);
            expect(onToggle).toHaveBeenNthCalledWith(2, false);
        });
    });

    describe("Styling", () => {
        it("applies padding-bottom-6 class when open", () => {
            const { container } = render(
                <Accordion
                    {...defaultProps}
                    isClosed={false}
                />
            );

            const accordion = container.querySelector(".usa-accordion");

            expect(accordion).toHaveClass("padding-bottom-6");
        });

        it("does not apply padding-bottom-6 class when closed", () => {
            const { container } = render(
                <Accordion
                    {...defaultProps}
                    isClosed={true}
                />
            );

            const accordion = container.querySelector(".usa-accordion");

            expect(accordion).not.toHaveClass("padding-bottom-6");
        });

        it("applies correct USWDS classes", () => {
            const { container } = render(<Accordion {...defaultProps} />);

            const button = screen.getByRole("button", { name: defaultProps.heading });
            const accordion = container.querySelector(".usa-accordion");
            const heading = screen.getByRole("heading", { level: 4 });
            const content = container.querySelector(".usa-accordion__content");

            expect(accordion).toHaveClass("usa-accordion");
            expect(heading).toHaveClass("usa-accordion__heading");
            expect(button).toHaveClass("usa-accordion__button");
            expect(button).toHaveClass("bg-brand-base-light-variant");
            expect(content).toHaveClass("usa-accordion__content");
            expect(content).toHaveClass("padding-x-0");
            expect(content).toHaveClass("overflow-visible");
        });
    });
});
