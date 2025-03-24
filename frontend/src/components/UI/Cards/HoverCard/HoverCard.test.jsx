import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, describe, it, vi } from "vitest";
import HoverCard from "./HoverCard";

describe("HoverCard", () => {
    const defaultProps = {
        title: "Test Card",
        description: "Test Description",
        variant: "light",
        icon: "/test-icon.png",
        level: 3
    };

    it("renders initial state correctly", () => {
        render(<HoverCard {...defaultProps} />);

        expect(screen.getByText("Test Card")).toBeInTheDocument();
        expect(screen.getByAltText("Test Card")).toBeInTheDocument();
        expect(screen.queryByText("Test Description")).not.toBeInTheDocument();
    });

    it("shows description on hover", async () => {
        const user = userEvent.setup();
        render(
            <HoverCard
                {...defaultProps}
                variant="light"
            />
        );

        const card = screen.getByRole("region", { name: /test card/i });
        await user.hover(card);

        expect(screen.getByText("Test Description")).toBeInTheDocument();
        expect(screen.queryByAltText("Test Card")).not.toBeInTheDocument();
    });

    it("hides description on mouse leave", async () => {
        const user = userEvent.setup();
        render(
            <HoverCard
                {...defaultProps}
                variant="light"
            />
        );

        const card = screen.getByRole("region", { name: /test card/i });
        await user.hover(card);
        await user.unhover(card);

        expect(screen.queryByText("Test Description")).not.toBeInTheDocument();
        expect(screen.getByAltText("Test Card")).toBeInTheDocument();
    });

    it("applies dark variant styles correctly", async () => {
        const user = userEvent.setup();
        render(
            <HoverCard
                {...defaultProps}
                variant="dark"
            />
        );

        const card = screen.getByRole("region", { name: /test card/i });
        await user.hover(card);

        expect(card).toHaveClass("bg-brand-primary-dark");
        expect(card).toHaveClass("text-white");
    });

    it("renders with different heading levels", () => {
        render(
            <HoverCard
                {...defaultProps}
                level={2}
            />
        );
        const heading = screen.getByText("Test Card");
        expect(heading.tagName).toBe("H2");
    });

    it("throws error for invalid heading level", () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        expect(() => {
            render(
                <HoverCard
                    {...defaultProps}
                    level={7}
                />
            );
        }).toThrow("Unrecognized heading level: 7");

        consoleSpy.mockRestore();
    });
});
