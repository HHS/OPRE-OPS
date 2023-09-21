import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { faClone } from "@fortawesome/free-regular-svg-icons";
import DisabledChangeIcons from "./DisabledChangeIcons";

/**
 * This component displays the edit, delete, and duplicate icons for a budget line.
 * @param {object} props - The component props.
 * @param {Object} props.budgetLine - The budget line data for the row.
 * @param {boolean} props.isBudgetLineEditable - Whether the budget line is editable.
 * @param {function} props.handleSetBudgetLineForEditing - The function to set the budget line for editing.
 * @param {function} props.handleDeleteBudgetLine - The function to delete the budget line.
 * @param {function} [props.handleDuplicateBudgetLine] - The function to duplicate the budget line.
 * @param {boolean} [props.duplicateIcon] - Whether to show the duplicate icon.
 * @returns {React.JSX.Element} - The rendered component.
 **/

const ChangeIcons = ({
    budgetLine,
    isBudgetLineEditable = false,
    handleSetBudgetLineForEditing = () => {},
    handleDeleteBudgetLine = () => {},
    handleDuplicateBudgetLine = () => {},
    duplicateIcon = true,
}) => {
    return (
        <>
            {!isBudgetLineEditable && <DisabledChangeIcons duplicateIcon={duplicateIcon} />}
            {isBudgetLineEditable && (
                <>
                    <FontAwesomeIcon
                        id={`edit-${budgetLine?.id}`}
                        data-cy="edit-row"
                        icon={faPen}
                        className="text-primary height-2 width-2 margin-right-1 cursor-pointer usa-tooltip"
                        title="edit"
                        data-position="top"
                        onClick={() => handleSetBudgetLineForEditing(budgetLine)}
                    />
                    <FontAwesomeIcon
                        id={`delete-${budgetLine?.id}`}
                        data-cy="delete-row"
                        data-testid="delete-row"
                        icon={faTrash}
                        title="delete"
                        data-position="top"
                        className="text-primary height-2 width-2 margin-right-1 cursor-pointer usa-tooltip"
                        onClick={() => handleDeleteBudgetLine(budgetLine.id)}
                    />
                    {duplicateIcon && (
                        <FontAwesomeIcon
                            id={`duplicate-${budgetLine?.id}`}
                            data-cy="duplicate-row"
                            icon={faClone}
                            title="duplicate"
                            data-position="top"
                            className={`text-primary height-2 width-2 cursor-pointer usa-tooltip ${
                                isBudgetLineEditable ? "margin-left-0" : "margin-left-6"
                            }`}
                            onClick={() => handleDuplicateBudgetLine(budgetLine)}
                        />
                    )}
                </>
            )}
        </>
    );
};

ChangeIcons.propTypes = {
    budgetLine: PropTypes.object.isRequired,
    isBudgetLineEditable: PropTypes.bool,
    handleSetBudgetLineForEditing: PropTypes.func,
    handleDeleteBudgetLine: PropTypes.func,
    handleDuplicateBudgetLine: PropTypes.func,
    duplicateIcon: PropTypes.bool,
};

export default ChangeIcons;
