import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, expect, describe, it, beforeEach } from "vitest";
import StepNotesEditor from "./StepNotesEditor";

const editNotesBtn = () => screen.queryByRole("button", { name: /edit notes/i });
const saveNotesBtn = () => screen.queryByRole("button", { name: /save notes/i });
const cancelBtn = () => screen.queryByRole("button", { name: /^cancel$/i });

/**
 * Renders StepNotesEditor with sensible defaults.
 */
const renderEditor = (props = {}) => {
    const setNotes = props.setNotes ?? vi.fn();
    const resetNotes = props.resetNotes ?? vi.fn();
    const onSave = props.onSave ?? vi.fn().mockResolvedValue(true);
    const utils = render(
        <StepNotesEditor
            notes={props.notes ?? "Existing notes"}
            setNotes={setNotes}
            resetNotes={resetNotes}
            notesLabel={props.notesLabel ?? "Existing notes"}
            savedNotes={props.savedNotes ?? "Existing notes"}
            stepId={props.stepId ?? 42}
            onSave={onSave}
            isDisabled={props.isDisabled ?? false}
            startInReadMode={props.startInReadMode}
            textAreaName={props.textAreaName}
        />
    );
    return { setNotes, resetNotes, onSave, ...utils };
};

describe("StepNotesEditor", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the notes value and an Edit Notes button in read mode when a note is saved", () => {
        renderEditor({ notes: "Some saved notes", notesLabel: "Some saved notes", savedNotes: "Some saved notes" });

        expect(screen.getByText("Some saved notes")).toBeInTheDocument();
        expect(editNotesBtn()).toBeInTheDocument();
        expect(saveNotesBtn()).not.toBeInTheDocument();
    });

    it("shows the freshly-saved value (notes) in read mode even if the server label still lags", () => {
        // After a save the live `notes` holds the new text while `notesLabel`
        // (server value) can still be stale until the refetch lands.
        renderEditor({ notes: "new text", notesLabel: "old text", savedNotes: "old text", startInReadMode: true });

        expect(screen.getByText("new text")).toBeInTheDocument();
        expect(screen.queryByText("old text")).not.toBeInTheDocument();
    });

    it("renders a Cancel button in edit mode when there is a read view to return to", () => {
        renderEditor({ savedNotes: "Some saved notes" });

        fireEvent.click(editNotesBtn());

        expect(saveNotesBtn()).toBeInTheDocument();
        expect(cancelBtn()).toBeInTheDocument();
    });

    it("omits the Cancel button on a fresh active step with no saved note", () => {
        renderEditor({ notes: "", savedNotes: "" });

        expect(saveNotesBtn()).toBeInTheDocument();
        expect(cancelBtn()).not.toBeInTheDocument();
    });

    it("restores the saved notes and exits edit mode on Cancel, clearing the dirty flag via resetNotes", () => {
        const { resetNotes, setNotes } = renderEditor({ savedNotes: "Original notes" });

        fireEvent.click(editNotesBtn());
        fireEvent.click(cancelBtn());

        expect(resetNotes).toHaveBeenCalledWith("Original notes");
        expect(setNotes).not.toHaveBeenCalled();
        expect(saveNotesBtn()).not.toBeInTheDocument();
        expect(editNotesBtn()).toBeInTheDocument();
    });

    it("falls back to 'None' when there is a saved note flag but no label", () => {
        // startInReadMode forces read mode (e.g. a completed step with no note).
        renderEditor({ notesLabel: "", notes: "", savedNotes: "", startInReadMode: true });

        expect(screen.getByText("None")).toBeInTheDocument();
        expect(editNotesBtn()).toBeInTheDocument();
    });

    it("starts in input mode (no Save→read collapse yet) when there is no saved note", () => {
        renderEditor({ notes: "", savedNotes: "" });

        expect(saveNotesBtn()).toBeInTheDocument();
        expect(editNotesBtn()).not.toBeInTheDocument();
    });

    it("starts in read mode when startInReadMode is set even with a saved note", () => {
        renderEditor({ notesLabel: "Saved", savedNotes: "Saved", startInReadMode: true });

        expect(editNotesBtn()).toBeInTheDocument();
        expect(saveNotesBtn()).not.toBeInTheDocument();
    });

    it("enters edit mode when Edit Notes is clicked", () => {
        renderEditor();

        fireEvent.click(editNotesBtn());

        expect(saveNotesBtn()).toBeInTheDocument();
    });

    it("disables Save Notes until the field has non-whitespace input", () => {
        renderEditor({ notes: "   ", savedNotes: "" });

        expect(saveNotesBtn()).toBeDisabled();
    });

    it("enables Save Notes once the field has input", () => {
        renderEditor({ notes: "A note", savedNotes: "" });

        expect(saveNotesBtn()).toBeEnabled();
    });

    it("calls onSave with the stepId and flips to read mode when the save succeeds", async () => {
        const onSave = vi.fn().mockResolvedValue(true);
        renderEditor({ onSave, stepId: 99, notes: "A note", savedNotes: "" });

        fireEvent.click(saveNotesBtn());

        expect(onSave).toHaveBeenCalledWith(99);
        await waitFor(() => expect(saveNotesBtn()).not.toBeInTheDocument());
        expect(editNotesBtn()).toBeInTheDocument();
    });

    it("stays in edit mode when the save fails", async () => {
        const onSave = vi.fn().mockResolvedValue(false);
        renderEditor({ onSave, notes: "A note", savedNotes: "" });

        fireEvent.click(saveNotesBtn());

        expect(onSave).toHaveBeenCalled();
        // The editor must remain in edit mode so the user's unsaved input isn't lost.
        await waitFor(() => expect(saveNotesBtn()).toBeInTheDocument());
        expect(editNotesBtn()).not.toBeInTheDocument();
    });

    it("uses a custom textarea name when provided", () => {
        renderEditor({ textAreaName: "notes-step-6", notes: "", savedNotes: "" });

        // eslint-disable-next-line testing-library/no-node-access
        expect(document.querySelector('textarea[name="notes-step-6"]')).toBeInTheDocument();
    });

    it("disables the controls when isDisabled is true", () => {
        renderEditor({ isDisabled: true, savedNotes: "Saved" });

        expect(editNotesBtn()).toBeDisabled();
    });
});
