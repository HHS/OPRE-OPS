import React from "react";

/**
 * Shared hook that owns a procurement tracker step's notes field and its save.
 *
 * All six step hooks previously inlined an identical `handleSaveNotes` plus a
 * `useState`/`useEffect` pair that synced the field from the server `notes`
 * prop. This centralizes that logic so the field state, server sync, and the
 * patch + success/error alert handling live in one place.
 *
 * Crucially, the field is only re-synced from the server while it is "clean".
 * As soon as the user edits it (via `setNotes`) it is marked dirty, so the RTK
 * Query refetch triggered by saving — which re-flows the server `notes` prop
 * back into the hook — will not clobber keystrokes typed since the last save.
 * The dirty flag is cleared after a successful save so future server updates
 * (e.g. another user's edit) sync in again.
 *
 * @param {ReturnType<typeof import("../../../api/opsAPI").useUpdateProcurementTrackerStepMutation>[0]} patchStep - The RTK Query mutation trigger for updating a step.
 * @param {string | null | undefined} serverNotes - The notes value from the server (from the step's fetched data).
 * @param {(alert: any) => void} setAlert - Callback to surface success/error alerts.
 * @returns {{ notes: string, setNotes: (value: string) => void, resetNotes: (value: string) => void, handleSaveNotes: (stepId: number) => Promise<boolean> }} The current notes value, a dirty setter, a clean-reset setter, and a save handler.
 */
export default function useSaveNotes(patchStep, serverNotes, setAlert) {
    const [notes, setNotesState] = React.useState(serverNotes ?? "");
    const isDirtyRef = React.useRef(false);

    // Sync from the server only while the field is clean, so a refetch after
    // saving (or an external update) does not overwrite in-progress edits.
    React.useEffect(() => {
        if (!isDirtyRef.current) {
            setNotesState(serverNotes ?? "");
        }
    }, [serverNotes]);

    /**
     * Updates the notes value and marks the field dirty so it won't be
     * overwritten by a subsequent server sync.
     * @param {string} value - The new notes value.
     */
    const setNotes = React.useCallback((value) => {
        isDirtyRef.current = true;
        setNotesState(value);
    }, []);

    /**
     * Resets the notes value and clears the dirty flag so the field resumes
     * syncing from the server. Use on cancel and after step completion.
     * @param {string} value - The value to restore (typically the last server value or "").
     */
    const resetNotes = React.useCallback((value) => {
        isDirtyRef.current = false;
        setNotesState(value ?? "");
    }, []);

    /**
     * Persists the notes for the given step.
     * @param {number} stepId - The ID of the procurement tracker step being updated.
     * @returns {Promise<boolean>} `true` when the save succeeds, `false` when it fails.
     */
    const handleSaveNotes = async (stepId) => {
        try {
            await patchStep({
                stepId,
                data: { notes: notes.trim() }
            }).unwrap();
            // The save succeeded, so the server value now matches the field.
            // Allow future server updates to sync in again.
            isDirtyRef.current = false;
            setAlert({
                type: "success",
                heading: "Notes Saved",
                message: "Your notes have been saved."
            });
            return true;
        } catch (error) {
            console.error("Failed to save notes", error);
            setAlert({
                type: "error",
                heading: "Error",
                message: "There was an error saving the notes."
            });
            return false;
        }
    };

    return { notes, setNotes, resetNotes, handleSaveNotes };
}
