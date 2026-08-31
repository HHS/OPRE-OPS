import { render, screen, fireEvent } from "@testing-library/react";
import { vi, expect, describe, it } from "vitest";
import SaveNotesButton from "./SaveNotesButton";

describe("SaveNotesButton", () => {
    it("renders a Save Notes button with the save-notes-button data-cy", () => {
        render(<SaveNotesButton onClick={vi.fn()} />);

        const button = screen.getByRole("button", { name: /save notes/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute("data-cy", "save-notes-button");
    });

    it("calls onClick when clicked", () => {
        const onClick = vi.fn();
        render(<SaveNotesButton onClick={onClick} />);

        fireEvent.click(screen.getByRole("button", { name: /save notes/i }));

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("is disabled when isDisabled is true", () => {
        render(
            <SaveNotesButton
                onClick={vi.fn()}
                isDisabled
            />
        );

        expect(screen.getByRole("button", { name: /save notes/i })).toBeDisabled();
    });

    it("renders the check icon in the primary color when enabled", () => {
        render(<SaveNotesButton onClick={vi.fn()} />);

        // eslint-disable-next-line testing-library/no-node-access
        const icon = screen.getByRole("button", { name: /save notes/i }).querySelector("svg");
        expect(icon).toHaveClass("text-primary");
        expect(icon).not.toHaveClass("text-disabled");
    });

    it("renders the check icon in the disabled color when disabled", () => {
        render(
            <SaveNotesButton
                onClick={vi.fn()}
                isDisabled
            />
        );

        // eslint-disable-next-line testing-library/no-node-access
        const icon = screen.getByRole("button", { name: /save notes/i }).querySelector("svg");
        expect(icon).toHaveClass("text-disabled");
        expect(icon).not.toHaveClass("text-primary");
    });
});
