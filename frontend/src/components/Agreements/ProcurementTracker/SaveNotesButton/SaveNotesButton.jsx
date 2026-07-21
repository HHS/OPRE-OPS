import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * @typedef {Object} SaveNotesButtonProps
 * @property {() => void} onClick - Click handler for the button.
 * @property {boolean} [isDisabled] - Whether the button is disabled.
 */

/**
 * Shared "Save Notes" button for a procurement tracker step's notes editor. Owns
 * the faCheck icon and button styling so the markup lives in one place across all
 * six step forms and {@link StepNotesEditor}. Callers position it (e.g. inside a
 * `display-flex flex-justify-end` container).
 *
 * @component
 * @param {SaveNotesButtonProps} props
 * @returns {React.ReactElement}
 */
const SaveNotesButton = ({ onClick, isDisabled = false }) => (
    <button
        type="button"
        className="usa-button usa-button--unstyled"
        data-cy="save-notes-button"
        onClick={onClick}
        disabled={isDisabled}
    >
        <FontAwesomeIcon
            icon={faCheck}
            size="2x"
            className="text-primary height-2 width-2 cursor-pointer"
        />
        Save Notes
    </button>
);

export default SaveNotesButton;
