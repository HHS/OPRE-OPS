import { faPen, faToggleOff, faToggleOn } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * @component - Agreement detail header.
 * @param {Object} props - The component props.
 * @param {string} props.heading - The heading to display.
 * @param {string} [props.details] - The details to display.
 * @param {boolean} props.includeDrafts - Whether the edit mode is on.
 * @param {Function} props.setIncludeDrafts - The function to set the edit mode.
 * @param {boolean} props.isEditable - Whether the agreement is editable.
 * @param {boolean} [props.isEditMode] - Whether the edit mode is on.
 * @param {Function} [props.setIsEditMode] - The function to set the edit mode.
 * @returns {React.ReactElement} - The rendered component.
 */
export const AgreementBudgetLinesHeader = ({
    heading,
    details,
    includeDrafts,
    setIncludeDrafts,
    isEditable,
    isEditMode = false,
    setIsEditMode = () => {}
}) => {
    return (
        <>
            <div className="display-flex flex-justify flex-align-center">
                <h2
                    id="budget-lines-header"
                    className="font-sans-lg"
                >
                    {heading}
                </h2>

                <div>
                    <button
                        id="toggleDraftBLIs"
                        className="hover:text-underline cursor-pointer margin-right-205"
                        onClick={() => setIncludeDrafts(!includeDrafts)}
                    >
                        <FontAwesomeIcon
                            icon={includeDrafts ? faToggleOn : faToggleOff}
                            size="2xl"
                            className={`margin-right-1 cursor-pointer ${includeDrafts ? "text-primary" : "text-base"}`}
                            title={includeDrafts ? "On (Drafts included)" : "Off (Drafts excluded)"}
                        />
                        <span className="text-primary">Include Drafts</span>
                    </button>

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
            </div>
            {details && <p className="font-sans-sm">{details}</p>}
        </>
    );
};

export default AgreementBudgetLinesHeader;
