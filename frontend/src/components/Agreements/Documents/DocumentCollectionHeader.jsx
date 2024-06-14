import { faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * Agreement detail header.
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.heading - The heading to display.
 * @param {string} props.details - The details to display.
 * @param {boolean} props.isEditMode - Whether the edit mode is on.
 * @param {function} props.setIsEditMode - The function to set the edit mode.
 * @param {boolean} props.isEditable - Whether the agreement is editable.
 * @returns {JSX.Element} - The rendered component.
 */
export const DocumentCollectionHeader = ({ heading, details, isEditMode, setIsEditMode, isEditable }) => {
    return (
        <>
            <div className="display-flex flex-justify flex-align-center">
                <h2 className="font-sans-lg">{heading}</h2>
                {!isEditMode && isEditable && (
                    <button
                        id="edit"
                        className="hover:text-underline cursor-pointer"
                        onClick={() => setIsEditMode(!isEditMode)}
                    >
                        <FontAwesomeIcon
                            icon={faPen}
                            size="2x"
                            className="text-primary height-2 width-2 margin-right-1 cursor-pointer usa-tooltip"
                            title="edit"
                            data-position="top"
                        />
                        <span className="text-primary">Edit</span>
                    </button>
                )}
            </div>
            <p className="font-sans-sm">{details}</p>
        </>
    );
};
