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

    it("triggers a success alert and resolves true on a successful save", async () => {
        mockUnwrap.mockResolvedValue({ success: true });
        const { result } = renderHook(() => useSaveNotes(mockPatchStep, "Some notes", mockSetAlert));

        let saved;
        await act(async () => {
            saved = await result.current.handleSaveNotes(1);
        });

        expect(saved).toBe(true);
        expect(mockSetAlert).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "success",
                heading: "Notes Saved"
            })
        );
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
});
