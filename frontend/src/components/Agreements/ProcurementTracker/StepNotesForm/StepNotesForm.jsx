import TextArea from "../../../UI/Form/TextArea";
import SaveNotesButton from "../SaveNotesButton/SaveNotesButton";
import { STEP_NOTES_MAX_LENGTH, STEP_NOTES_TEXTAREA_STYLE } from "../ProcurementTracker.constants";

/**
 * @typedef {Object} StepNotesFormProps
 * @property {string} notes - The current notes value bound to the TextArea.
 * @property {(value: string) => void} setNotes - Setter for the notes value.
 * @property {() => void} onSave - Handler invoked when the "Save Notes" button is clicked.
 * @property {boolean} [isDisabled] - Whether the notes controls should be disabled.
 * @property {string} [textAreaName] - Name attribute for the TextArea (defaults to "notes").
 */

/**
 * Active-step notes editor: an optional-notes TextArea plus a "Save Notes" button.
 *
 * Extracted from the six ProcurementTrackerStep*.jsx forms, where this exact block
 * was previously copy-pasted. Keeps the shared style constants and Save Notes button
 * in one place.
 *
 * @component
 * @param {StepNotesFormProps} props
 * @returns {React.ReactElement}
 */
const StepNotesForm = ({ notes, setNotes, onSave, isDisabled = false, textAreaName = "notes" }) => (
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
            <SaveNotesButton
                onClick={onSave}
                isDisabled={isDisabled}
            />
        </div>
    </div>
);

export default StepNotesForm;
