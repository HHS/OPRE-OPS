import { vi, expect, describe, it, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useSaveNotes from "./useSaveNotes";

describe("useSaveNotes", () => {
    const mockUnwrap = vi.fn();
    const mockPatchStep = vi.fn(() => ({ unwrap: mockUnwrap }));
    const mockSetAlert = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockPatchStep.mockReturnValue({ unwrap: mockUnwrap });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("seeds the notes field from the server value", () => {
        const { result } = renderHook(() => useSaveNotes(mockPatchStep, "Server notes", mockSetAlert));

        expect(result.current.notes).toBe("Server notes");
    });

    it("defaults the notes field to an empty string when the server value is nullish", () => {
        const { result } = renderHook(() => useSaveNotes(mockPatchStep, null, mockSetAlert));

        expect(result.current.notes).toBe("");
    });

    it("PATCHes the step with only the trimmed notes field", async () => {
        mockUnwrap.mockResolvedValue({ success: true });
        const { result } = renderHook(() => useSaveNotes(mockPatchStep, "   Padded notes   ", mockSetAlert));

        await act(async () => {
            await result.current.handleSaveNotes(7);
        });

        expect(mockPatchStep).toHaveBeenCalledWith({
            stepId: 7,
            data: { notes: "Padded notes" }
        });
        expect(Object.keys(mockPatchStep.mock.calls[0][0].data)).toEqual(["notes"]);
    });

    it("resolves true on a successful save without showing a success alert", async () => {
        mockUnwrap.mockResolvedValue({ success: true });
        const { result } = renderHook(() => useSaveNotes(mockPatchStep, "Some notes", mockSetAlert));

        let saved;
        await act(async () => {
            saved = await result.current.handleSaveNotes(1);
        });

        expect(saved).toBe(true);
        // The tracker never shows success toasts — the UI flips to read mode instead.
        expect(mockSetAlert).not.toHaveBeenCalled();
    });

    it("triggers an error alert and resolves false when the API call fails", async () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        const mockError = new Error("API Error");
        mockUnwrap.mockRejectedValue(mockError);
        const { result } = renderHook(() => useSaveNotes(mockPatchStep, "Some notes", mockSetAlert));

        let saved;
        await act(async () => {
            saved = await result.current.handleSaveNotes(1);
        });

        expect(saved).toBe(false);
        expect(console.error).toHaveBeenCalledWith("Failed to save notes", mockError);
        expect(mockSetAlert).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "error",
                heading: "Error"
            })
        );
    });

    it("syncs the field from the server value while it is clean (unedited)", () => {
        const { result, rerender } = renderHook(
            ({ serverNotes }) => useSaveNotes(mockPatchStep, serverNotes, mockSetAlert),
            {
                initialProps: { serverNotes: "First" }
            }
        );

        expect(result.current.notes).toBe("First");

        rerender({ serverNotes: "Updated from server" });

        expect(result.current.notes).toBe("Updated from server");
    });

    it("does NOT overwrite in-progress edits when a refetch delivers a new server value", () => {
        // Reproduces the race the review flagged: user edits the field, then a
        // save-triggered refetch flows a fresh (older) server value back in.
        const { result, rerender } = renderHook(
            ({ serverNotes }) => useSaveNotes(mockPatchStep, serverNotes, mockSetAlert),
            {
                initialProps: { serverNotes: "Saved value" }
            }
        );

        act(() => {
            result.current.setNotes("User keystrokes after save");
        });

        // Refetch resolves and re-flows the previously-saved value as the prop.
        rerender({ serverNotes: "Saved value" });

        expect(result.current.notes).toBe("User keystrokes after save");
    });

    it("resetNotes restores the value and clears the dirty flag so the field resumes server sync", () => {
        const { result, rerender } = renderHook(
            ({ serverNotes }) => useSaveNotes(mockPatchStep, serverNotes, mockSetAlert),
            { initialProps: { serverNotes: "Saved value" } }
        );

        act(() => {
            result.current.setNotes("Unsaved edit");
        });
        expect(result.current.notes).toBe("Unsaved edit");

        act(() => {
            result.current.resetNotes("Saved value");
        });
        expect(result.current.notes).toBe("Saved value");

        // Dirty flag is cleared — a new server value should now sync in.
        rerender({ serverNotes: "Updated from server" });
        expect(result.current.notes).toBe("Updated from server");
    });

    it("resetNotes with no argument restores the current committed (server) value", () => {
        const { result } = renderHook(() => useSaveNotes(mockPatchStep, "Server value", mockSetAlert));

        act(() => {
            result.current.setNotes("Unsaved edit");
        });
        expect(result.current.notes).toBe("Unsaved edit");

        // Cancel with no argument: discard back to the committed value.
        act(() => {
            result.current.resetNotes();
        });
        expect(result.current.notes).toBe("Server value");
    });

    it("resetNotes with no argument restores the just-SAVED note even while the server prop is still stale", async () => {
        // The stale-prop hazard: after a first-time save the serverNotes prop stays
        // "" until the invalidation refetch lands. A step-level Cancel that passed
        // that stale prop would wipe the just-saved note. resetNotes() (no arg) must
        // restore the committed value recorded at save time instead.
        mockUnwrap.mockResolvedValue({ success: true });
        const { result, rerender } = renderHook(
            ({ serverNotes }) => useSaveNotes(mockPatchStep, serverNotes, mockSetAlert),
            { initialProps: { serverNotes: "" } }
        );

        act(() => {
            result.current.setNotes("First note");
        });

        await act(async () => {
            await result.current.handleSaveNotes(1);
        });

        // serverNotes prop is intentionally still "" (refetch not yet resolved).
        rerender({ serverNotes: "" });

        // User later edits then cancels.
        act(() => {
            result.current.setNotes("Different text");
        });
        act(() => {
            result.current.resetNotes();
        });

        // Restored to the just-saved value, NOT the stale "" prop.
        expect(result.current.notes).toBe("First note");
    });

    it("resetNotes does not mark the field dirty, so a subsequent server update overwrites it", () => {
        const { result, rerender } = renderHook(
            ({ serverNotes }) => useSaveNotes(mockPatchStep, serverNotes, mockSetAlert),
            { initialProps: { serverNotes: "Original" } }
        );

        act(() => {
            result.current.setNotes("Dirty edit");
        });

        // Cancel: reset to the server value and clear the dirty flag.
        act(() => {
            result.current.resetNotes("Original");
        });

        // An unrelated server update should now flow in (dirty flag is clear).
        rerender({ serverNotes: "External update" });
        expect(result.current.notes).toBe("External update");
    });

    it("keeps keystrokes typed while the save is in-flight (does not clear the dirty flag)", async () => {
        // Bug 1: user types during the in-flight PATCH, then the success path runs.
        // The dirty flag must stay set so the invalidation refetch can't clobber
        // the new keystrokes with the (now stale) server value.
        let resolveSave;
        mockUnwrap.mockReturnValue(
            new Promise((resolve) => {
                resolveSave = resolve;
            })
        );
        const { result, rerender } = renderHook(
            ({ serverNotes }) => useSaveNotes(mockPatchStep, serverNotes, mockSetAlert),
            { initialProps: { serverNotes: "Original" } }
        );

        act(() => {
            result.current.setNotes("First edit");
        });

        // Kick off the save (do not await yet — the PATCH is pending).
        let savePromise;
        act(() => {
            savePromise = result.current.handleSaveNotes(1);
        });

        // User types more while the request is still in-flight.
        act(() => {
            result.current.setNotes("First edit + more");
        });

        // Save resolves; success path runs but must NOT clear the dirty flag.
        await act(async () => {
            resolveSave({ success: true });
            await savePromise;
        });

        // Refetch flows the value that was actually persisted ("First edit").
        rerender({ serverNotes: "First edit" });

        // In-flight keystrokes survive.
        expect(result.current.notes).toBe("First edit + more");
    });

    it("resumes syncing from the server after a successful save clears the dirty flag", async () => {
        mockUnwrap.mockResolvedValue({ success: true });
        const { result, rerender } = renderHook(
            ({ serverNotes }) => useSaveNotes(mockPatchStep, serverNotes, mockSetAlert),
            {
                initialProps: { serverNotes: "Original" }
            }
        );

        act(() => {
            result.current.setNotes("Edited");
        });

        await act(async () => {
            await result.current.handleSaveNotes(1);
        });

        // A later external update should now sync in again.
        rerender({ serverNotes: "Changed elsewhere" });

        expect(result.current.notes).toBe("Changed elsewhere");
    });

    it("starts notesResetKey at 0 and bumps it on every resetNotes so the editor can collapse to read mode", () => {
        // Bug (step-level Cancel): resetNotes drives a resetSignal on StepNotesEditor.
        // A changing key is what tells the editor to close an open textarea, so each
        // reset must produce a new value.
        const { result } = renderHook(() => useSaveNotes(mockPatchStep, "Server notes", mockSetAlert));

        expect(result.current.notesResetKey).toBe(0);

        act(() => {
            result.current.resetNotes("Server notes");
        });
        expect(result.current.notesResetKey).toBe(1);

        act(() => {
            result.current.resetNotes("Server notes");
        });
        expect(result.current.notesResetKey).toBe(2);
    });
});
