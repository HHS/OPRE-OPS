import React from "react";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TextArea from "../../../UI/Form/TextArea";
import SaveNotesButton from "../SaveNotesButton/SaveNotesButton";
import { STEP_NOTES_MAX_LENGTH, STEP_NOTES_TEXTAREA_STYLE } from "../ProcurementTracker.constants";

/**
 * @typedef {Object} StepNotesEditorProps
 * @property {string} notes - The current notes value bound to the TextArea.
 * @property {(value: string) => void} setNotes - Setter for the notes value (marks the field dirty).
 * @property {(value: string) => void} resetNotes - Resets the notes value and clears the dirty flag; used by Cancel to discard unsaved edits.
 * @property {string} [notesLabel] - The persisted notes to display in read-only mode.
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
 * Notes" buttons) and a read mode (the persisted note text with an inline "Edit
 * Notes" pencil at the end of the content). Clicking "Save Notes" always flips the
 * field from input mode to read mode, so the interaction is identical across every
 * step. Edit mode only exits when `onSave` resolves truthy, so a failed save keeps
 * the user's edits visible. "Cancel" discards unsaved edits (restoring the last
 * saved value via `resetNotes`) and returns to read mode. The Save button is
 * disabled until the field has non-whitespace input (per the Figma spec).
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
    notesLabel,
    savedNotes,
    stepId,
    onSave,
    isDisabled = false,
    startInReadMode = false,
    textAreaName = "notes"
}) => {
    // Start in read mode when a note has already been saved (or when the caller
    // forces it, e.g. a completed step); otherwise start in input mode so the
    // user can add one. A successful save also flips to read mode.
    const hasSavedNote = Boolean((savedNotes ?? "").trim());
    // The editor can return to read mode when there is a saved note to show or
    // when the caller renders read mode by default (completed steps). A fresh
    // active step with no saved note has no read view to cancel back to, so it
    // stays in input mode and omits Cancel.
    const canReturnToReadMode = hasSavedNote || startInReadMode;
    const [isEditingNotes, setIsEditingNotes] = React.useState(!canReturnToReadMode);

    if (isEditingNotes) {
        return (
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
                <div className="display-flex flex-justify-end">
                    {canReturnToReadMode && (
                        <button
                            type="button"
                            className="usa-button usa-button--unstyled margin-right-2"
                            data-cy="cancel-edit-notes-button"
                            onClick={() => {
                                resetNotes(savedNotes ?? "");
                                setIsEditingNotes(false);
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
                                setIsEditingNotes(false);
                            }
                        }}
                        isDisabled={isDisabled || !notes.trim()}
                    />
                </div>
            </div>
        );
    }

    // Prefer the live field value: right after a save it holds the just-saved
    // text, while `notesLabel` (the server value) can lag until the refetch lands.
    const displayedNotes = notes || notesLabel;

    // Self-contained <dl> (matching the sibling TermTag components) so the
    // "Notes" label stays associated with its value as a term/description pair,
    // and the markup is valid in both the active-step fieldset and the
    // completed-step <dl> layout. The Edit Notes button sits inline at the end
    // of the note text, right-aligned regardless of length (per Figma).
    return (
        <dl className="font-12px">
            <dt className="margin-0 text-base-dark margin-top-3">Notes</dt>
            <dd className="margin-0 margin-top-1 display-flex flex-align-center">
                <span className="margin-right-2">{displayedNotes || "None"}</span>
                <button
                    type="button"
                    className="usa-button usa-button--unstyled flex-shrink-0"
                    data-cy="edit-notes-button"
                    onClick={() => setIsEditingNotes(true)}
                    disabled={isDisabled}
                >
                    <FontAwesomeIcon
                        icon={faPen}
                        className="margin-right-1"
                        aria-hidden="true"
                    />
                    Edit Notes
                </button>
            </dd>
        </dl>
    );
};

export default StepNotesEditor;
