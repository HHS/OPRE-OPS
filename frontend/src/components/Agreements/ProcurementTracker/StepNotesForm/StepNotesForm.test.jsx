import { render, screen, fireEvent } from "@testing-library/react";
import { vi, expect, describe, it } from "vitest";
import StepNotesForm from "./StepNotesForm";

const renderForm = (props = {}) => {
    const setNotes = props.setNotes ?? vi.fn();
    const onSave = props.onSave ?? vi.fn();
    const utils = render(
        <StepNotesForm
            notes={props.notes ?? ""}
            setNotes={setNotes}
            onSave={onSave}
            isDisabled={props.isDisabled ?? false}
            textAreaName={props.textAreaName}
        />
    );
    return { setNotes, onSave, ...utils };
};

describe("StepNotesForm", () => {
    it("renders the optional notes field with the current value", () => {
        renderForm({ notes: "Existing notes" });

        const notesField = screen.getByLabelText(/Notes \(optional\)/i);
        expect(notesField).toHaveValue("Existing notes");
    });

    it("calls setNotes when the user types", () => {
        const { setNotes } = renderForm();

        fireEvent.change(screen.getByLabelText(/Notes \(optional\)/i), { target: { value: "Typed notes" } });

        expect(setNotes).toHaveBeenCalledWith("Typed notes");
    });

    it("calls onSave when the Save Notes button is clicked", () => {
        const { onSave } = renderForm();

        fireEvent.click(screen.getByRole("button", { name: /save notes/i }));

        expect(onSave).toHaveBeenCalledTimes(1);
    });

    it("uses the default textarea name of 'notes'", () => {
        renderForm();

        // eslint-disable-next-line testing-library/no-node-access
        expect(document.querySelector('textarea[name="notes"]')).toBeInTheDocument();
    });

    it("uses a custom textarea name when provided", () => {
        renderForm({ textAreaName: "notes-step-6" });

        // eslint-disable-next-line testing-library/no-node-access
        expect(document.querySelector('textarea[name="notes-step-6"]')).toBeInTheDocument();
    });

    it("disables the notes field and Save Notes button when isDisabled is true", () => {
        renderForm({ isDisabled: true });

        expect(screen.getByLabelText(/Notes \(optional\)/i)).toBeDisabled();
        expect(screen.getByRole("button", { name: /save notes/i })).toBeDisabled();
    });
});
