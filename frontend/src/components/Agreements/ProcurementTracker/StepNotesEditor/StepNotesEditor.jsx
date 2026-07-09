import React from "react";
import { faCheck, faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TextArea from "../../../UI/Form/TextArea";

/**
 * @typedef {Object} StepNotesEditorProps
 * @property {string} notes - The current notes value bound to the TextArea.
 * @property {(value: string) => void} setNotes - Setter for the notes value.
 * @property {string} [notesLabel] - The persisted notes to display in read-only mode.
 * @property {string} [savedNotes] - The last-saved notes value, restored when the user cancels an edit.
 * @property {number} [stepId] - The ID of the procurement tracker step being edited.
 * @property {(stepId: number | undefined) => Promise<boolean>} onSave - Save handler; should resolve `true` on success so edit mode only exits when the save succeeds.
 * @property {boolean} [isDisabled] - Whether the notes controls should be disabled.
 * @property {string} [textAreaName] - Name attribute for the TextArea (defaults to "notes").
 */

/**
 * Shared editor for a procurement tracker step's completed-state notes.
 *
 * Renders the read-only notes value with an "Edit Notes" button and, when
 * editing, a TextArea with Cancel/Save controls. Edit mode only exits when
 * `onSave` resolves truthy, so a failed save keeps the user's edits visible.
 *
 * @component
 * @param {StepNotesEditorProps} props
 * @returns {React.ReactElement}
 */
const StepNotesEditor = ({
    notes,
    setNotes,
    notesLabel,
    savedNotes,
    stepId,
    onSave,
    isDisabled = false,
    textAreaName = "notes"
}) => {
    const [isEditingNotes, setIsEditingNotes] = React.useState(false);

    if (isEditingNotes) {
        return (
            <div className="display-table">
                <TextArea
                    name={textAreaName}
                    label=""
                    className="margin-top-1"
                    maxLength={750}
                    value={notes}
                    onChange={/** @param {any} _ @param {any} value */ (_, value) => setNotes(value)}
                    textAreaStyle={{ height: "8.5rem", minWidth: "30rem" }}
                    isDisabled={isDisabled}
                />
                <div className="display-flex flex-justify-end">
                    <button
                        type="button"
                        className="usa-button usa-button--unstyled margin-right-2"
                        data-cy="cancel-edit-notes-button"
                        onClick={() => {
                            setNotes(savedNotes ?? "");
                            setIsEditingNotes(false);
                        }}
                        disabled={isDisabled}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="usa-button usa-button--unstyled"
                        data-cy="save-notes-button"
                        onClick={async () => {
                            const didSave = await onSave(stepId);
                            if (didSave) {
                                setIsEditingNotes(false);
                            }
                        }}
                        disabled={isDisabled}
                    >
                        <FontAwesomeIcon
                            icon={faCheck}
                            size="2x"
                            className="text-primary height-2 width-2 cursor-pointer"
                        />
                        Save Notes
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <dd className="margin-0 margin-top-1">{notesLabel || "None"}</dd>
            <button
                type="button"
                className="usa-button usa-button--unstyled margin-top-1"
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
        </>
    );
};

export default StepNotesEditor;
