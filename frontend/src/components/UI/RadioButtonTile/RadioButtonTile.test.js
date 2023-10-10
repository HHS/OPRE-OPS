import { render, screen, fireEvent } from "@testing-library/react";
import RadioButtonTile from "./RadioButtonTile";

describe("RadioButtonTile", () => {
    it("renders the label and description", () => {
        render(
            <RadioButtonTile
                label="Test Label"
                description="Test Description"
                setValue={() => {}}
            />
        );
        expect(screen.getByText("Test Label")).toBeInTheDocument();
        expect(screen.getByText("Test Description")).toBeInTheDocument();
    });

    it("sets the input value when clicked", () => {
        render(
            <RadioButtonTile
                label="Test Label"
                description="Test Description"
                setValue={() => {}}
            />
        );
        const input = screen.getByRole("radio");
        fireEvent.click(input);
        expect(input).toBeChecked();
    });

    it("should not be checked by default", () => {
        render(
            <RadioButtonTile
                label="Test Label"
                description="Test Description"
            />
        );
        const input = screen.getByRole("radio");
        expect(input).not.toBeChecked();
    });

    it('should be checked when the "checked" prop is true', () => {
        render(
            <RadioButtonTile
                label="Test Label"
                description="Test Description"
                checked={true}
            />
        );
        const input = screen.getByRole("radio");
        expect(input).toBeChecked();
    });

    it('should be disabled when the "disabled" prop is true', () => {
        render(
            <RadioButtonTile
                label="Test Label"
                description="Test Description"
                disabled={true}
            />
        );
        const input = screen.getByRole("radio");
        expect(input).toBeDisabled();
    });
});
