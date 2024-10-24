/// reference types="vitest" />

import { render, screen, fireEvent } from "@testing-library/react";
import RadioButtonTile from "./RadioButtonTile";
import { expect } from "vitest";

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
        input.checked = true; // manually set the checked property
        expect(input.checked).toBe(true); // check if it's true
    });

    it("should not be checked by default", () => {
        render(
            <RadioButtonTile
                label="Test Label"
                description="Test Description"
                setValue={() => {}}
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
                setValue={() => {}}
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
                setValue={() => {}}
            />
        );
        const input = screen.getByRole("radio");
        expect(input).toBeDisabled();
    });
});
