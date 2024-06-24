import { faClone } from "@fortawesome/free-regular-svg-icons";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PropTypes from "prop-types";
import icons from "../../../uswds/img/sprite.svg";
import Tooltip from "../../UI/USWDS/Tooltip";
import { DISABLED_ICON_CLASSES } from "./DisabledChangeIcons.constants";

/**
 * This component displays the edit, delete, and duplicate icons for a budget line.
 * @component
 * @param {object} props - The component props.
 * @param {Object} props.item - The item or data for the row.
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

    return (
        <>
            <div className="display-flex flex-align-center">
                {isItemEditable && (
                    <>
                        <Tooltip
                            label="Edit"
                            className="line-height-body-1"
                        >
                            <button
                                id={`edit-${item?.id}`}
                                title="Edit"
                                aria-label="Edit"
                                data-cy="edit-row"
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
                            label={`${isItemDeletable ? "Delete" : "Cannot delete"}`}
                            className="line-height-body-1"
                        >
                            <button
                                id={`delete-${item?.id}`}
                                title="Delete"
                                aria-label="Delete"
                                data-cy="delete-row"
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
                            position="top"
                            label={
                                lockedMessage ? lockedMessage : "Only team members listed on this agreement can edit"
                            }
                            className="line-height-body-1"
                        >
                            <button
                                id={`edit-${item?.id}`}
                                title="Edit"
                                aria-label="Edit"
                                data-cy="edit-row"
                                disabled={true}
                            >
                                <FontAwesomeIcon
                                    icon={faPen}
                                    className={disabledClasses}
                                />
                            </button>
                        </Tooltip>
                        <Tooltip
                            position="top"
                            label={`${
                                lockedMessage ? lockedMessage : "Only team members listed on this agreement can delete"
                            }`}
                            className="line-height-body-1"
                        >
                            <button
                                id={`delete-${item?.id}`}
                                title="Delete"
                                aria-label="Delete"
                                data-cy="delete-row"
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
                        label="Duplicate"
                        className="line-height-body-1"
                    >
                        <button
                            id={`duplicate-row-${item?.id}`}
                            title="Duplicate"
                            aria-label="Duplicate"
                            data-cy="duplicate-row"
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
                        position="top"
                        label="Disabled"
                        className="line-height-body-1"
                    >
                        <button
                            id={`duplicate-${item?.id}`}
                            title="Disabled"
                            aria-label="Disabled"
                            data-cy="duplicate-row"
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
                        label="Submit for approval"
                        className="line-height-body-1"
                    >
                        <button
                            id={`submit-for-approval-${item.id}`}
                            title="Submit for approval"
                            aria-label="Submit for approval"
                            data-cy="submit-row"
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
                        position="top"
                        label={`${
                            lockedMessage
                                ? lockedMessage
                                : "Only team members listed on this agreement can submit it for approval"
                        }`}
                        className="line-height-body-1"
                    >
                        <button
                            id={`submit-for-approval-${item?.id}`}
                            title="Submit for Approval"
                            aria-label="Submit for Approval"
                            data-cy="submit-row"
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

ChangeIcons.propTypes = {
    item: PropTypes.object.isRequired,
    isItemEditable: PropTypes.bool,
    lockedMessage: PropTypes.string,
    handleSetItemForEditing: PropTypes.func,
    isItemDeletable: PropTypes.bool,
    handleDeleteItem: PropTypes.func,
    handleDuplicateItem: PropTypes.func,
    duplicateIcon: PropTypes.bool,
    sendToReviewIcon: PropTypes.bool,
    handleSubmitItemForApproval: PropTypes.func,
    goToApproveIcon: PropTypes.bool,
    handleGoToApprove: PropTypes.func
};

export default ChangeIcons;
