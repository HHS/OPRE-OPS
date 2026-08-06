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
            savedNotes={props.savedNotes ?? "Existing notes"}
            stepId={props.stepId ?? 42}
            onSave={onSave}
            isDisabled={props.isDisabled ?? false}
            startInReadMode={props.startInReadMode}
            textAreaName={props.textAreaName}
            resetSignal={props.resetSignal}
        />
    );
    return { setNotes, resetNotes, onSave, ...utils };
};

describe("StepNotesEditor", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the notes value and an Edit Notes button in read mode when a note is saved", () => {
        renderEditor({ notes: "Some saved notes", savedNotes: "Some saved notes" });

        expect(screen.getByText("Some saved notes")).toBeInTheDocument();
        expect(editNotesBtn()).toBeInTheDocument();
        expect(saveNotesBtn()).not.toBeInTheDocument();
    });

    it("shows the live notes value in read mode (the source of truth for display)", () => {
        // `notes` is authoritative: useSaveNotes holds the just-saved text, so read
        // mode never depends on a lagging server value.
        renderEditor({ notes: "new text", savedNotes: "old text", startInReadMode: true });

        expect(screen.getByText("new text")).toBeInTheDocument();
        expect(screen.queryByText("old text")).not.toBeInTheDocument();
    });

    it("shows 'None' in read mode when an existing note was cleared to empty", () => {
        // After clearing a saved note and saving, the live `notes` is empty. Read
        // mode must show "None" immediately, not the stale saved value.
        renderEditor({ notes: "", savedNotes: "old text", startInReadMode: true });

        expect(screen.getByText("None")).toBeInTheDocument();
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

    it("restores the committed notes and exits edit mode on Cancel, clearing the dirty flag via resetNotes", () => {
        // Cancel restores the value committed when edit mode was entered (the live
        // `notes`), NOT the `savedNotes` prop. Here they diverge — mimicking the
        // post-save refetch window where `savedNotes` is still the pre-save value —
        // so cancelling must restore "Committed", not the stale "Stale server value".
        const { resetNotes, setNotes } = renderEditor({
            notes: "Committed",
            savedNotes: "Stale server value",
            startInReadMode: true
        });

        fireEvent.click(editNotesBtn());
        fireEvent.click(cancelBtn());

        expect(resetNotes).toHaveBeenCalledWith("Committed");
        expect(resetNotes).not.toHaveBeenCalledWith("Stale server value");
        expect(setNotes).not.toHaveBeenCalled();
        expect(saveNotesBtn()).not.toBeInTheDocument();
        expect(editNotesBtn()).toBeInTheDocument();
    });

    it("falls back to 'None' in forced read mode when the note is empty", () => {
        // startInReadMode forces read mode (e.g. a completed step with no note).
        renderEditor({ notes: "", savedNotes: "", startInReadMode: true });

        expect(screen.getByText("None")).toBeInTheDocument();
        expect(editNotesBtn()).toBeInTheDocument();
    });

    it("starts in input mode (no Save→read collapse yet) when there is no saved note", () => {
        renderEditor({ notes: "", savedNotes: "" });

        expect(saveNotesBtn()).toBeInTheDocument();
        expect(editNotesBtn()).not.toBeInTheDocument();
    });

    it("starts in read mode when startInReadMode is set even with a saved note", () => {
        renderEditor({ notes: "Saved", savedNotes: "Saved", startInReadMode: true });

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

    it("enables Save Notes when an existing saved note is cleared to empty (empty save allowed)", () => {
        // A note was previously saved (savedNotes) but the field is now empty —
        // the user is allowed to clear it and save the empty value. Enter edit
        // mode via Edit Notes since a saved note starts in read mode.
        renderEditor({ notes: "", savedNotes: "Existing notes" });

        fireEvent.click(editNotesBtn());

        expect(saveNotesBtn()).toBeEnabled();
    });

    it("flips to read mode showing 'None' after saving an existing note cleared to empty", async () => {
        const onSave = vi.fn().mockResolvedValue(true);
        renderEditor({ onSave, notes: "", savedNotes: "Existing notes" });

        fireEvent.click(editNotesBtn());
        fireEvent.click(saveNotesBtn());

        expect(onSave).toHaveBeenCalled();
        // Saving empty returns to read mode showing "None", not the open textarea.
        await waitFor(() => expect(saveNotesBtn()).not.toBeInTheDocument());
        expect(editNotesBtn()).toBeInTheDocument();
        expect(screen.getByText("None")).toBeInTheDocument();
    });

    it("keeps the Cancel button after a first-time save while the server prop is still stale", async () => {
        // Bug 1: after the first save on a fresh active step, `savedNotes` stays ""
        // until the RTK Query refetch lands. Re-entering edit mode in that window
        // must still render Cancel so keyboard users aren't trapped (WCAG 2.4.3).
        const onSave = vi.fn().mockResolvedValue(true);
        renderEditor({ onSave, notes: "A note", savedNotes: "" });

        // Fresh active step starts in input mode with no Cancel.
        expect(cancelBtn()).not.toBeInTheDocument();

        fireEvent.click(saveNotesBtn());
        await waitFor(() => expect(editNotesBtn()).toBeInTheDocument());

        // savedNotes is intentionally still "" (refetch not yet resolved).
        fireEvent.click(editNotesBtn());
        expect(cancelBtn()).toBeInTheDocument();
    });

    it("keeps Save enabled to clear a just-saved note while the server prop is still stale", async () => {
        // Bug 2: same stale-`savedNotes` window. After the first save the user
        // re-enters edit mode and clears the field; Save must stay enabled so the
        // note can be cleared before the refetch promotes the prop.
        const onSave = vi.fn().mockResolvedValue(true);
        const { rerender } = renderEditor({ onSave, notes: "A note", savedNotes: "" });

        fireEvent.click(saveNotesBtn());
        await waitFor(() => expect(editNotesBtn()).toBeInTheDocument());

        fireEvent.click(editNotesBtn());
        // Simulate the user clearing the textarea (parent re-renders with notes="")
        // while savedNotes is still "".
        rerender(
            <StepNotesEditor
                notes=""
                setNotes={vi.fn()}
                resetNotes={vi.fn()}
                savedNotes=""
                stepId={42}
                onSave={onSave}
            />
        );

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

    it("stays in edit mode and preserves the user's text when the save fails", async () => {
        const onSave = vi.fn().mockResolvedValue(false);
        const { setNotes, resetNotes } = renderEditor({ onSave, notes: "A note", savedNotes: "" });

        fireEvent.click(saveNotesBtn());

        expect(onSave).toHaveBeenCalled();
        // The editor must remain in edit mode so the user's unsaved input isn't lost.
        await waitFor(() => expect(saveNotesBtn()).toBeInTheDocument());
        expect(editNotesBtn()).not.toBeInTheDocument();
        // The failed save must not touch the notes value: the textarea keeps the
        // user's text and neither setNotes nor resetNotes is called on the failure path.
        // eslint-disable-next-line testing-library/no-node-access
        expect(document.querySelector("textarea")).toHaveValue("A note");
        expect(resetNotes).not.toHaveBeenCalled();
        expect(setNotes).not.toHaveBeenCalled();
    });

    it("calls setNotes with the typed value as the user edits the textarea", () => {
        const { setNotes } = renderEditor({ notes: "", savedNotes: "" });

        // eslint-disable-next-line testing-library/no-node-access
        fireEvent.change(document.querySelector("textarea"), { target: { value: "typed text" } });

        expect(setNotes).toHaveBeenCalledWith("typed text");
    });

    it("restores focus to the Edit Notes button after a first-time save (savedNotes still empty)", async () => {
        // The trickier focus path: a fresh active step has no Edit Notes button at
        // mount (canReturnToReadMode is false), so `hasEverSaved` is promoted mid-save
        // and the button appears for the first time. Focus must still land on it and
        // not drop to <body>, even though savedNotes stays "" during the refetch window.
        const onSave = vi.fn().mockResolvedValue(true);
        renderEditor({ onSave, notes: "A note", savedNotes: "" });

        saveNotesBtn().focus();
        fireEvent.click(saveNotesBtn());

        await waitFor(() => expect(editNotesBtn()).toBeInTheDocument());
        expect(editNotesBtn()).toHaveFocus();
    });

    it("disables the Save Notes button and textarea in edit mode when isDisabled is true", () => {
        // The fresh-active-step path starts directly in edit mode, so isDisabled's
        // effect on the edit-mode controls is reachable without clicking a (disabled)
        // Edit Notes button.
        renderEditor({ isDisabled: true, notes: "A note", savedNotes: "" });

        expect(saveNotesBtn()).toBeDisabled();
        // eslint-disable-next-line testing-library/no-node-access
        expect(document.querySelector("textarea")).toBeDisabled();
    });

    it("restores focus to the Edit Notes button after a successful save (no drop to body)", async () => {
        // Bug 2: leaving edit mode unmounts the focused Save Notes button; focus
        // must land on Edit Notes rather than resetting to <body> (WCAG 2.4.3/2.4.7).
        const onSave = vi.fn().mockResolvedValue(true);
        renderEditor({ onSave, notes: "A note", savedNotes: "Existing notes" });

        fireEvent.click(editNotesBtn());
        saveNotesBtn().focus();
        fireEvent.click(saveNotesBtn());

        await waitFor(() => expect(editNotesBtn()).toBeInTheDocument());
        expect(editNotesBtn()).toHaveFocus();
    });

    it("restores focus to the Edit Notes button after Cancel", () => {
        renderEditor({ savedNotes: "Original notes" });

        fireEvent.click(editNotesBtn());
        cancelBtn().focus();
        fireEvent.click(cancelBtn());

        expect(editNotesBtn()).toHaveFocus();
    });

    it("does not steal focus on the initial read-mode mount", () => {
        renderEditor({ notes: "Saved", savedNotes: "Saved", startInReadMode: true });

        // Nothing was interacted with; focus must not have jumped to Edit Notes.
        expect(editNotesBtn()).not.toHaveFocus();
    });

    it("announces the save to assistive tech via an aria-live region after a successful save", async () => {
        const onSave = vi.fn().mockResolvedValue(true);
        renderEditor({ onSave, notes: "A note", savedNotes: "Existing notes" });

        const announcement = screen.getByRole("status");
        // No premature announcement before the save.
        expect(announcement).toHaveTextContent("");
        expect(announcement).toHaveAttribute("aria-live", "polite");

        fireEvent.click(editNotesBtn());
        fireEvent.click(saveNotesBtn());

        await waitFor(() => expect(editNotesBtn()).toBeInTheDocument());
        expect(screen.getByRole("status")).toHaveTextContent("Notes saved.");
    });

    it("clears the save announcement when re-entering edit mode so a repeat save re-announces", async () => {
        const onSave = vi.fn().mockResolvedValue(true);
        renderEditor({ onSave, notes: "A note", savedNotes: "Existing notes" });

        fireEvent.click(editNotesBtn());
        fireEvent.click(saveNotesBtn());
        await waitFor(() => expect(editNotesBtn()).toBeInTheDocument());
        expect(screen.getByRole("status")).toHaveTextContent("Notes saved.");

        // Re-entering edit mode clears the region so the next save is announced anew.
        fireEvent.click(editNotesBtn());
        expect(screen.getByRole("status")).toHaveTextContent("");
    });

    it("does not announce a save when the save fails", async () => {
        const onSave = vi.fn().mockResolvedValue(false);
        renderEditor({ onSave, notes: "A note", savedNotes: "" });

        fireEvent.click(saveNotesBtn());

        await waitFor(() => expect(onSave).toHaveBeenCalled());
        expect(screen.getByRole("status")).toHaveTextContent("");
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

    it("collapses the open textarea back to read mode when the parent bumps resetSignal (step-level Cancel)", () => {
        // Bug 1: a step-level Cancel resets the notes value via resetNotes but the
        // editor's edit/read toggle is local state. The parent bumps resetSignal so
        // an open textarea collapses back to read mode instead of lingering.
        const { rerender } = renderEditor({ savedNotes: "Saved note", resetSignal: 0 });

        fireEvent.click(editNotesBtn());
        expect(saveNotesBtn()).toBeInTheDocument();

        rerender(
            <StepNotesEditor
                notes="Saved note"
                setNotes={vi.fn()}
                resetNotes={vi.fn()}
                savedNotes="Saved note"
                stepId={42}
                onSave={vi.fn().mockResolvedValue(true)}
                resetSignal={1}
            />
        );

        expect(saveNotesBtn()).not.toBeInTheDocument();
        expect(editNotesBtn()).toBeInTheDocument();
    });

    it("does not collapse a fresh active step (no read view) when resetSignal changes", () => {
        // A fresh active step with no saved note has no read mode to fall back to,
        // so a resetSignal bump must leave it in input mode rather than hiding the
        // only editable control.
        const { rerender } = renderEditor({ notes: "", savedNotes: "", resetSignal: 0 });

        expect(saveNotesBtn()).toBeInTheDocument();

        rerender(
            <StepNotesEditor
                notes=""
                setNotes={vi.fn()}
                resetNotes={vi.fn()}
                savedNotes=""
                stepId={42}
                onSave={vi.fn().mockResolvedValue(true)}
                resetSignal={1}
            />
        );

        expect(saveNotesBtn()).toBeInTheDocument();
        expect(editNotesBtn()).not.toBeInTheDocument();
    });

    it("does not restore a note on Cancel when the saved value arrived after mount (async load)", () => {
        // Bug 2: when savedNotes is undefined at mount (RTK Query still in-flight),
        // the editor opens implicitly in input mode without enterEditMode running, so
        // committedNotesRef held only its empty seed. When the note arrives, Cancel
        // must restore THAT value, not "" — otherwise it wipes the just-loaded note.
        // Render directly (not via renderEditor, which defaults savedNotes) so
        // savedNotes is genuinely undefined at mount, as during an in-flight fetch.
        const resetNotes = vi.fn();
        const { rerender } = render(
            <StepNotesEditor
                notes=""
                setNotes={vi.fn()}
                resetNotes={resetNotes}
                savedNotes={undefined}
                stepId={42}
                onSave={vi.fn().mockResolvedValue(true)}
            />
        );

        // Editor opened directly in input mode (no saved note yet).
        expect(saveNotesBtn()).toBeInTheDocument();

        // The async fetch resolves: notes + savedNotes flow in with the loaded value.
        rerender(
            <StepNotesEditor
                notes="Loaded note"
                setNotes={vi.fn()}
                resetNotes={resetNotes}
                savedNotes="Loaded note"
                stepId={42}
                onSave={vi.fn().mockResolvedValue(true)}
            />
        );

        fireEvent.click(cancelBtn());

        // Cancel restores the loaded value, not the stale empty seed.
        expect(resetNotes).toHaveBeenCalledWith("Loaded note");
        expect(resetNotes).not.toHaveBeenCalledWith("");
    });

    it("discards unsaved keystrokes on Cancel when the user types after an async-loaded note (implicit edit mode)", () => {
        // Bug 2 corollary: after the async note loads into a still-implicit editor,
        // the Cancel button appears. If the user then types, committedNotesRef must
        // stay pinned to the server value ("Loaded note") — NOT the live keystrokes —
        // so Cancel discards the edit rather than committing it. The committed ref
        // tracks savedNotes, not notes, precisely to survive this.
        const resetNotes = vi.fn();
        const { rerender } = render(
            <StepNotesEditor
                notes=""
                setNotes={vi.fn()}
                resetNotes={resetNotes}
                savedNotes={undefined}
                stepId={42}
                onSave={vi.fn().mockResolvedValue(true)}
            />
        );

        // Async fetch resolves with the saved note; editor is still implicit.
        rerender(
            <StepNotesEditor
                notes="Loaded note"
                setNotes={vi.fn()}
                resetNotes={resetNotes}
                savedNotes="Loaded note"
                stepId={42}
                onSave={vi.fn().mockResolvedValue(true)}
            />
        );

        // User types in the still-open textarea (savedNotes unchanged, notes dirty).
        rerender(
            <StepNotesEditor
                notes="Loaded note + unsaved edits"
                setNotes={vi.fn()}
                resetNotes={resetNotes}
                savedNotes="Loaded note"
                stepId={42}
                onSave={vi.fn().mockResolvedValue(true)}
            />
        );

        fireEvent.click(cancelBtn());

        // Cancel discards back to the committed server value, not the typed text.
        expect(resetNotes).toHaveBeenCalledWith("Loaded note");
        expect(resetNotes).not.toHaveBeenCalledWith("Loaded note + unsaved edits");
    });
});
