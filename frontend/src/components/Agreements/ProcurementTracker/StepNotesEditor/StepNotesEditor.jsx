import React from "react";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TextArea from "../../../UI/Form/TextArea";
import SaveNotesButton from "../SaveNotesButton/SaveNotesButton";
import { STEP_NOTES_MAX_LENGTH, STEP_NOTES_TEXTAREA_STYLE, STEP_NOTES_WIDTH } from "../ProcurementTracker.constants";

/**
 * @typedef {Object} StepNotesEditorProps
 * @property {string} notes - The current notes value bound to the TextArea.
 * @property {(value: string) => void} setNotes - Setter for the notes value (marks the field dirty).
 * @property {(value: string) => void} resetNotes - Resets the notes value and clears the dirty flag; used by Cancel to discard unsaved edits.
 * @property {string} [savedNotes] - The last-saved notes value; when present the editor starts in read mode, and Cancel restores it.
 * @property {number} [stepId] - The ID of the procurement tracker step being edited.
 * @property {(stepId: number | undefined) => Promise<boolean>} onSave - Save handler; should resolve `true` on success so edit mode only exits when the save succeeds.
 * @property {boolean} [isDisabled] - Whether the notes controls should be disabled.
 * @property {boolean} [startInReadMode] - Force read mode on mount even when there is no saved note (used for completed steps, which show "None" + Edit Notes).
 * @property {string} [textAreaName] - Name attribute for the TextArea (defaults to "notes").
 */

/**
 * Shared editor for a procurement tracker step's notes, used by every editable
 * step regardless of status (PENDING/ACTIVE/COMPLETED).
 *
 * Renders an input mode (a "Notes (optional)" TextArea with "Cancel" and "Save
 * Notes" buttons) and a read mode (the persisted note text with an "Edit Notes"
 * pencil below it). A successful save flips the field from input mode to read
 * mode. Edit mode only exits when `onSave` resolves truthy, so a failed save keeps
 * the user's edits visible. "Cancel" discards unsaved edits (restoring the last
 * saved value via `resetNotes`) and returns to read mode.
 *
 * Saving rules:
 * - A first-time note (no `savedNotes`) can't be saved until the field has
 *   non-whitespace input, and Save disables until then (per the Figma spec).
 * - Once a note has been saved, the user may clear it and save the empty value;
 *   read mode then shows "None".
 *
 * An active step with no saved note starts in input mode so the user can add one;
 * a completed step (`startInReadMode`) always starts in read mode, showing "None"
 * when empty.
 *
 * @component
 * @param {StepNotesEditorProps} props
 * @returns {React.ReactElement}
 */
const StepNotesEditor = ({
    notes,
    setNotes,
    resetNotes,
    savedNotes,
    stepId,
    onSave,
    isDisabled = false,
    startInReadMode = false,
    textAreaName = "notes"
}) => {
    // Whether a note has ever been persisted for this step. Seeded from the
    // server prop, then promoted locally the instant a save succeeds. It must NOT
    // be re-derived from `savedNotes` on every render: after a first-time save the
    // prop stays stale (still "") until the RTK Query invalidation refetch lands,
    // and reading it directly during that window would drop the Cancel button
    // (WCAG 2.4.3) and re-disable Save for clearing the just-saved note.
    const [hasEverSaved, setHasEverSaved] = React.useState(Boolean((savedNotes ?? "").trim()));
    // Promote (never demote) when a non-empty server value arrives after mount —
    // e.g. an async data load or another user's edit — so the read-mode
    // affordances still appear. Clearing a saved note to "" keeps `hasEverSaved`
    // true, which is correct: an already-saved note may be saved empty.
    React.useEffect(() => {
        if ((savedNotes ?? "").trim()) {
            setHasEverSaved(true);
        }
    }, [savedNotes]);

    // The editor can return to read mode when a note has ever been saved or when
    // the caller renders read mode by default (completed steps). A fresh active
    // step with no saved note has no read view to cancel back to, so it stays in
    // input mode and omits Cancel.
    const canReturnToReadMode = hasEverSaved || startInReadMode;
    const [isEditingNotes, setIsEditingNotes] = React.useState(!canReturnToReadMode);

    // Leaving edit mode (Save or Cancel) unmounts the focused Save Notes/Cancel
    // button; without this the browser resets focus to <body> (WCAG 2.4.3/2.4.7).
    // Flag the return-to-read transition and move focus onto the Edit Notes button
    // once it renders. Guarded by the ref so the initial read-mode mount doesn't
    // steal focus.
    const editNotesRef = React.useRef(null);
    const shouldRestoreFocusRef = React.useRef(false);
    React.useEffect(() => {
        if (!isEditingNotes && shouldRestoreFocusRef.current) {
            shouldRestoreFocusRef.current = false;
            editNotesRef.current?.focus();
        }
    }, [isEditingNotes]);

    /** Return to read mode after Save/Cancel, restoring focus to Edit Notes. */
    const returnToReadMode = () => {
        shouldRestoreFocusRef.current = true;
        setIsEditingNotes(false);
    };

    // The value committed as of the last time edit mode was entered. Cancel restores
    // THIS, not the `savedNotes` prop: after a save the prop stays stale (still the
    // pre-save server value) until the RTK Query invalidation refetch lands, so
    // cancelling back to it would briefly revert read mode to the old note (or flash
    // "None" for a first-time note). Seeded from the server value and refreshed each
    // time the user (re)enters edit mode.
    const committedNotesRef = React.useRef(savedNotes ?? "");

    // Screen-reader announcement for a completed save. The visual edit→read flip
    // is the only save-completion cue for sighted users; assistive tech gets this
    // aria-live region instead (it replaces the removed "Notes Saved" success
    // alert). The region is rendered persistently below so its text change is
    // announced; entering edit mode clears it so a repeat save re-announces.
    const [saveAnnouncement, setSaveAnnouncement] = React.useState("");

    /** Enter edit mode, clearing any prior save announcement. */
    const enterEditMode = () => {
        // Snapshot the currently committed note so Cancel can restore it without
        // depending on the (possibly stale) `savedNotes` prop.
        committedNotesRef.current = notes;
        setSaveAnnouncement("");
        setIsEditingNotes(true);
    };

    // A persistent visually-hidden live region so the save announcement is spoken
    // even as the editor swaps between the edit (<div>) and read (<dl>) subtrees.
    const liveRegion = (
        <span
            className="usa-sr-only"
            role="status"
            aria-live="polite"
            data-cy="notes-save-announcement"
        >
            {saveAnnouncement}
        </span>
    );

    if (isEditingNotes) {
        return (
            <>
                {liveRegion}
                <div className="display-table">
                    <TextArea
                        name={textAreaName}
                        label="Notes (optional)"
                        className="margin-top-2"
                        maxLength={STEP_NOTES_MAX_LENGTH}
                        value={notes}
                        onChange={/** @param {any} _ @param {any} value */ (_, value) => setNotes(value)}
                        textAreaStyle={STEP_NOTES_TEXTAREA_STYLE}
                        isDisabled={isDisabled}
                    />
                    {/* margin-top-neg-205 (-1.25rem) lifts the button row up onto the
                    character-count ("N left") line so the gap above the buttons matches
                    the gap the "remaining characters" hint has from the textarea,
                    rather than sitting a full row lower. */}
                    <div className="display-flex flex-justify-end margin-top-neg-205">
                        {canReturnToReadMode && (
                            <button
                                type="button"
                                className="usa-button usa-button--unstyled margin-right-2"
                                data-cy="cancel-edit-notes-button"
                                onClick={() => {
                                    resetNotes(committedNotesRef.current);
                                    returnToReadMode();
                                }}
                                disabled={isDisabled}
                            >
                                Cancel
                            </button>
                        )}
                        <SaveNotesButton
                            onClick={async () => {
                                const didSave = await onSave(stepId);
                                if (didSave) {
                                    // Promote immediately so Cancel stays available and
                                    // Save stays enabled for clearing this note, without
                                    // waiting for the server prop to catch up.
                                    setHasEverSaved(true);
                                    setSaveAnnouncement("Notes saved.");
                                    returnToReadMode();
                                }
                            }}
                            // Disable Save only for a first-time, empty entry. Once a note
                            // has been saved the user may clear it and save the empty value.
                            isDisabled={isDisabled || (!hasEverSaved && !notes.trim())}
                        />
                    </div>
                </div>
            </>
        );
    }

    // `notes` is the source of truth for read mode: useSaveNotes seeds it from the
    // server value, holds the just-saved text, and re-syncs from the server while
    // the field is clean. Trimming matches what was persisted (the save sends
    // `notes.trim()`), so an existing note cleared to empty shows "None" immediately
    // instead of flashing the stale server value before the refetch lands.
    const displayedNotes = notes.trim();

    // Self-contained <dl> (matching the sibling TermTag components) so the
    // "Notes" label stays associated with its value as a term/description pair,
    // and the markup is valid in both the active-step fieldset and the
    // completed-step <dl> layout. The note text and its Edit Notes button both
    // live inside the <dd> (flow content) so the button stays a valid <dl>
    // descendant; the block note text pushes the button onto its own line below.
    return (
        <>
            {liveRegion}
            <dl>
                <dt className="margin-0 text-base-dark margin-top-3">Notes</dt>
                <dd className="margin-0 margin-top-1">
                    <div
                        className="wrap-text"
                        style={{ maxWidth: STEP_NOTES_WIDTH }}
                    >
                        {displayedNotes || "None"}
                    </div>
                    <button
                        ref={editNotesRef}
                        type="button"
                        className="usa-button usa-button--unstyled margin-top-1"
                        data-cy="edit-notes-button"
                        onClick={enterEditMode}
                        disabled={isDisabled}
                    >
                        <FontAwesomeIcon
                            icon={faPen}
                            aria-hidden="true"
                        />
                        Edit Notes
                    </button>
                </dd>
            </dl>
        </>
    );
};

export default StepNotesEditor;
