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
});
