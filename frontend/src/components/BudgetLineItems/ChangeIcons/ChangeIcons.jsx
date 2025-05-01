import { faClone } from "@fortawesome/free-regular-svg-icons";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getTooltipLabel } from "../../../helpers/budgetLines.helpers";
import icons from "../../../uswds/img/sprite.svg";
import Tooltip from "../../UI/USWDS/Tooltip";
import { DISABLED_ICON_CLASSES } from "./DisabledChangeIcons.constants";

/**
 * This component displays the edit, delete, and duplicate icons for a budget line.
 * @component
 * @param {object} props - The component props.
 * @param {import("../BudgetLineTypes").BudgetLine} props.item - The item or data for the row.
 * @param {boolean} props.isItemEditable - Whether the item is editable.
 * @param {string} [props.lockedMessage] - The message to display when the item is not editable.
 * @param {function} props.handleSetItemForEditing - The function to set the row item for editing.
 * @param {boolean} [props.isItemDeletable] - Whether the item is deletable.
 * @param {function} props.handleDeleteItem - The function to delete the row.
 * @param {function} [props.handleDuplicateItem] - The function to duplicate the row.
 * @param {boolean} [props.duplicateIcon] - Whether to show the duplicate icon.
 * @param {boolean} [props.sendToReviewIcon] - Whether to show the send to review icon.
 * @param {function} [props.handleSubmitItemForApproval] - The function to submit the item for approval.
 * @returns {JSX.Element} - The rendered component.
 **/

const ChangeIcons = ({
    item,
    isItemEditable = false,
    lockedMessage,
    handleSetItemForEditing = () => {},
    isItemDeletable = isItemEditable,
    handleDeleteItem = () => {},
    handleDuplicateItem = () => {},
    duplicateIcon = true,
    sendToReviewIcon = false,
    handleSubmitItemForApproval = () => {}
}) => {
    const disabledClasses = `text-primary height-2 width-2 margin-right-1 cursor-pointer ${DISABLED_ICON_CLASSES}`;

    const notEditableOrDeletableMsg = getTooltipLabel(item);

    return (
        <>
            <div className="display-flex flex-align-center">
                {isItemEditable && (
                    <>
                        <Tooltip
                            position="top"
                            label="Edit"
                            className="line-height-body-1"
                        >
                            <button
                                id={`edit-${item?.id}`}
                                title="Edit"
                                aria-label="Edit"
                                data-cy="edit-row"
                                data-testid="edit-row"
                                onClick={() => handleSetItemForEditing(item?.id)}
                            >
                                <FontAwesomeIcon
                                    title="Edit"
                                    icon={faPen}
                                    className="text-primary height-2 width-2 margin-right-1 cursor-pointer"
                                />
                            </button>
                        </Tooltip>
                        <Tooltip
                            position="top"
                            label={`${isItemDeletable ? "Delete" : "Disabled"}`}
                            className="line-height-body-1"
                        >
                            <button
                                id={`delete-${item?.id}`}
                                title="Delete"
                                aria-label="Delete"
                                data-cy="delete-row"
                                data-testid="delete-row"
                                onClick={() => isItemDeletable && handleDeleteItem(item.id, item.display_name)}
                            >
                                <FontAwesomeIcon
                                    title="Delete"
                                    icon={faTrash}
                                    className={`text-primary height-2 width-2 margin-right-1 cursor-pointer ${
                                        !isItemDeletable ? DISABLED_ICON_CLASSES : ""
                                    }`}
                                />
                            </button>
                        </Tooltip>
                    </>
                )}
                {!isItemEditable && (
                    <>
                        <Tooltip
                            position="left"
                            label={lockedMessage ? lockedMessage : notEditableOrDeletableMsg}
                            className="line-height-body-1"
                        >
                            <button
                                id={`edit-${item?.id}`}
                                title="Edit"
                                aria-label="Edit"
                                data-cy="edit-row"
                                disabled={true}
                                data-testid="edit-row"
                            >
                                <FontAwesomeIcon
                                    icon={faPen}
                                    className={disabledClasses}
                                />
                            </button>
                        </Tooltip>
                        <Tooltip
                            position="left"
                            label={`${lockedMessage ? lockedMessage : notEditableOrDeletableMsg}`}
                            className="line-height-body-1"
                        >
                            <button
                                id={`delete-${item?.id}`}
                                title="Delete"
                                aria-label="Delete"
                                data-cy="delete-row"
                                data-testid="delete-row"
                            >
                                <FontAwesomeIcon
                                    icon={faTrash}
                                    className={disabledClasses}
                                />
                            </button>
                        </Tooltip>
                    </>
                )}

                {isItemEditable && duplicateIcon && (
                    <Tooltip
                        position="top"
                        label="Duplicate"
                        className="line-height-body-1"
                    >
                        <button
                            id={`duplicate-row-${item?.id}`}
                            title="Duplicate"
                            aria-label="Duplicate"
                            data-cy="duplicate-row"
                            data-testid="duplicate-row"
                            onClick={() => handleDuplicateItem(item?.id)}
                        >
                            <FontAwesomeIcon
                                icon={faClone}
                                className="text-primary height-2 width-2 cursor-pointer margin-left-0"
                            />
                        </button>
                    </Tooltip>
                )}
                {/* NOTE: Do we ever want to not allow duplicating BLIs? */}
                {!isItemEditable && duplicateIcon && (
                    <Tooltip
                        position="left"
                        label="Disabled"
                        className="line-height-body-1"
                    >
                        <button
                            id={`duplicate-${item?.id}`}
                            title="Disabled"
                            aria-label="Disabled"
                            data-cy="duplicate-row"
                            data-testid="duplicate-row"
                            disabled={true}
                            onClick={() => {}}
                        >
                            <FontAwesomeIcon
                                icon={faClone}
                                className={disabledClasses}
                            />
                        </button>
                    </Tooltip>
                )}
                {isItemEditable && sendToReviewIcon && (
                    <Tooltip
                        position="top"
                        label="Submit for approval"
                        className="line-height-body-1"
                    >
                        <button
                            id={`submit-for-approval-${item.id}`}
                            title="Submit for approval"
                            aria-label="Submit for approval"
                            data-cy="submit-row"
                            data-testid="submit-row"
                            onClick={() => handleSubmitItemForApproval(item.id)}
                        >
                            <svg className="usa-icon text-primary height-205 width-205 cursor-pointer margin-left-0">
                                <use xlinkHref={`${icons}#send`}></use>
                            </svg>
                        </button>
                    </Tooltip>
                )}
                {!isItemEditable && sendToReviewIcon && (
                    <Tooltip
                        position="left"
                        label={`${
                            lockedMessage
                                ? lockedMessage
                                : "Only team members on this agreement can edit, delete, or send to approval"
                        }`}
                        className="line-height-body-1"
                    >
                        <button
                            id={`submit-for-approval-${item?.id}`}
                            title="Submit for Approval"
                            aria-label="Submit for Approval"
                            data-cy="submit-row"
                            data-testid="submit-row"
                            disabled={true}
                        >
                            <svg
                                className={`usa-icon text-primary height-205 width-205 cursor-pointer margin-left-0 ${DISABLED_ICON_CLASSES}`}
                            >
                                <use xlinkHref={`${icons}#send`}></use>
                            </svg>
                        </button>
                    </Tooltip>
                )}
            </div>
        </>
    );
};

export default ChangeIcons;
