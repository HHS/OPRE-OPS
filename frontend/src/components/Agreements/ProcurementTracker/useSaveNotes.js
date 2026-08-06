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
 * @returns {{ notes: string, setNotes: (value: string) => void, resetNotes: (value?: string) => void, notesResetKey: number, handleSaveNotes: (stepId: number) => Promise<boolean> }} The current notes value, a dirty setter, a reset-to-committed setter, a remount key for the notes editor, and a save handler.
 */
export default function useSaveNotes(patchStep, serverNotes, setAlert) {
    const [notes, setNotesState] = React.useState(serverNotes ?? "");
    const isDirtyRef = React.useRef(false);
    // The last value known to be persisted server-side: the initial server value,
    // then the just-saved value on each successful save, and the server value again
    // whenever a clean refetch syncs in. Cancel restores THIS rather than the raw
    // `serverNotes` prop, which stays stale after a first-time save until the RTK
    // Query invalidation refetch lands — resetting to that stale prop would wipe the
    // just-saved note to "" and flash "None" until the refetch arrives.
    const committedNotesRef = React.useRef(serverNotes ?? "");
    // Bumped on every `resetNotes` so the caller can pass it to StepNotesEditor as a
    // `resetSignal`. A step-level Cancel calls `resetNotes` to discard unsaved field
    // edits, but the editor's read/edit toggle is local state with no external escape
    // hatch; without this the textarea would stay open after Cancel. The editor
    // watches the changing signal and collapses itself back to read mode in lockstep
    // with the value reset.
    const [notesResetKey, setNotesResetKey] = React.useState(0);
    // Mirrors the latest `notes` value so `handleSaveNotes` can read the value at
    // the moment its await resolves rather than the value captured in its closure
    // (the handler is recreated each render but its in-flight invocation is not).
    const notesRef = React.useRef(notes);
    notesRef.current = notes;

    // Sync from the server only while the field is clean, so a refetch after
    // saving (or an external update) does not overwrite in-progress edits. A clean
    // server value is by definition the committed value, so track it for Cancel.
    React.useEffect(() => {
        if (!isDirtyRef.current) {
            committedNotesRef.current = serverNotes ?? "";
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
     *
     * With no argument it restores the last committed value (the safe default for
     * Cancel — see `committedNotesRef`). An explicit `value` overrides that when a
     * caller has a specific value to restore.
     * @param {string} [value] - Optional value to restore; defaults to the last committed value.
     */
    const resetNotes = React.useCallback((value) => {
        isDirtyRef.current = false;
        setNotesState(value ?? committedNotesRef.current);
        // Remount the editor so an open textarea collapses back to read mode.
        setNotesResetKey((key) => key + 1);
    }, []);

    /**
     * Persists the notes for the given step.
     * @param {number} stepId - The ID of the procurement tracker step being updated.
     * @returns {Promise<boolean>} `true` when the save succeeds, `false` when it fails.
     */
    const handleSaveNotes = React.useCallback(
        async (stepId) => {
            // Snapshot what we're persisting before the round-trip, reading the live
            // value from the ref so the stable callback isn't pinned to a stale
            // `notes`. If the user types while the PATCH is in-flight, `setNotes`
            // re-marks the field dirty; we must not clear that below or the
            // invalidation refetch would re-flow the (now stale) server value and
            // clobber those keystrokes.
            const notesToSave = notesRef.current.trim();
            try {
                await patchStep({
                    stepId,
                    data: { notes: notesToSave }
                }).unwrap();
                // The just-saved value is now the committed value, so a later Cancel
                // restores it even though the `serverNotes` prop stays stale until the
                // invalidation refetch lands.
                committedNotesRef.current = notesToSave;
                // The save succeeded, so the server value now matches the field —
                // but only if nothing new was typed during the round-trip. Read the
                // live value from the ref (not a closed-over `notes`) and clear the
                // dirty flag only when the field still holds exactly what we saved,
                // so future server updates can sync in again without losing edits.
                if (notesRef.current.trim() === notesToSave) {
                    isDirtyRef.current = false;
                }
                // No success alert: the tracker never shows success toasts. The UI
                // instead flips the notes field from input mode to read mode.
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
        },
        [patchStep, setAlert]
    );

    return { notes, setNotes, resetNotes, notesResetKey, handleSaveNotes };
}
