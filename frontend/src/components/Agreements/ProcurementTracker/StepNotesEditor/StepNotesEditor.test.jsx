import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, expect, describe, it, beforeEach } from "vitest";
import StepNotesEditor from "./StepNotesEditor";

const editNotesBtn = () => screen.queryByRole("button", { name: /edit notes/i });
const saveNotesBtn = () => screen.queryByRole("button", { name: /save notes/i });
const cancelBtn = () => screen.queryByRole("button", { name: /cancel/i });

/**
 * Renders StepNotesEditor inside a <dl> (its normal parent) with sensible defaults.
 */
const renderEditor = (props = {}) => {
    const setNotes = vi.fn();
    const resetNotes = props.resetNotes ?? vi.fn();
    const onSave = props.onSave ?? vi.fn().mockResolvedValue(true);
    const utils = render(
        <dl>
            <StepNotesEditor
                notes={props.notes ?? "Existing notes"}
                setNotes={setNotes}
                resetNotes={resetNotes}
                notesLabel={props.notesLabel ?? "Existing notes"}
                savedNotes={props.savedNotes ?? "Existing notes"}
                stepId={props.stepId ?? 42}
                onSave={onSave}
                isDisabled={props.isDisabled ?? false}
                textAreaName={props.textAreaName}
            />
        </dl>
    );
    return { setNotes, resetNotes, onSave, ...utils };
};

describe("StepNotesEditor", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the notes label and an Edit Notes button in read-only mode", () => {
        renderEditor({ notesLabel: "Some saved notes" });

        expect(screen.getByText("Some saved notes")).toBeInTheDocument();
        expect(editNotesBtn()).toBeInTheDocument();
        expect(saveNotesBtn()).not.toBeInTheDocument();
    });

    it("falls back to 'None' when there is no notes label", () => {
        renderEditor({ notesLabel: "" });

        expect(screen.getByText("None")).toBeInTheDocument();
    });

    it("enters edit mode when Edit Notes is clicked", () => {
        renderEditor();

        fireEvent.click(editNotesBtn());

        expect(saveNotesBtn()).toBeInTheDocument();
        expect(cancelBtn()).toBeInTheDocument();
    });

    it("restores the saved notes and exits edit mode on Cancel, using resetNotes to clear the dirty flag", () => {
        const { setNotes, resetNotes } = renderEditor({ savedNotes: "Original notes" });

        fireEvent.click(editNotesBtn());
        fireEvent.click(cancelBtn());

        expect(resetNotes).toHaveBeenCalledWith("Original notes");
        expect(setNotes).not.toHaveBeenCalled();
        expect(saveNotesBtn()).not.toBeInTheDocument();
        expect(editNotesBtn()).toBeInTheDocument();
    });

    it("calls onSave with the stepId and exits edit mode when the save succeeds", async () => {
        const onSave = vi.fn().mockResolvedValue(true);
        renderEditor({ onSave, stepId: 99 });

        fireEvent.click(editNotesBtn());
        fireEvent.click(saveNotesBtn());

        expect(onSave).toHaveBeenCalledWith(99);
        await waitFor(() => expect(saveNotesBtn()).not.toBeInTheDocument());
        expect(editNotesBtn()).toBeInTheDocument();
    });

    it("stays in edit mode when the save fails", async () => {
        const onSave = vi.fn().mockResolvedValue(false);
        renderEditor({ onSave });

        fireEvent.click(editNotesBtn());
        fireEvent.click(saveNotesBtn());

        expect(onSave).toHaveBeenCalled();
        // The editor must remain in edit mode so the user's unsaved input isn't lost.
        await waitFor(() => expect(saveNotesBtn()).toBeInTheDocument());
        expect(editNotesBtn()).not.toBeInTheDocument();
    });

    it("uses a custom textarea name when provided", () => {
        renderEditor({ textAreaName: "notes-step-6" });

        fireEvent.click(editNotesBtn());

        // eslint-disable-next-line testing-library/no-node-access
        expect(document.querySelector('textarea[name="notes-step-6"]')).toBeInTheDocument();
    });

    it("disables the controls when isDisabled is true", () => {
        renderEditor({ isDisabled: true });

        expect(editNotesBtn()).toBeDisabled();
    });
});
