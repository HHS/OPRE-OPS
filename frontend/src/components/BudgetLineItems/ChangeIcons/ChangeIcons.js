import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { faClone } from "@fortawesome/free-regular-svg-icons";
import DisabledChangeIcons from "./DisabledChangeIcons";
import { DISABLED_ICON_CLASSES } from "./DisabledChangeIcons.constants";
import icons from "../../../uswds/img/sprite.svg";
import { Tooltip } from "../../UI/USWDS/Tooltip";

/**
 * This component displays the edit, delete, and duplicate icons for a budget line.
 * @param {object} props - The component props.
 * @param {Object} props.item - The item or data for the row.
 * @param {boolean} props.isItemEditable - Whether the item is editable.
 * @param {function} props.handleSetItemForEditing - The function to set the row item for editing.
 * @param {boolean} [props.isItemDeletable] - Whether the item is deletable.
 * @param {function} props.handleDeleteItem - The function to delete the row.
 * @param {function} [props.handleDuplicateItem] - The function to duplicate the row.
 * @param {boolean} [props.duplicateIcon] - Whether to show the duplicate icon.
 * @param {boolean} [props.sendToReviewIcon] - Whether to show the send to review icon.
 * @param {function} [props.handleSubmitItemForApproval] - The function to submit the item for approval.
 * @param {boolean} [props.goToApproveIcon] - Whether to show the go-to-approve icon.
 * @param {function} [props.handleGoToApprove] - The function to navigate to approve the item
 * @returns {React.JSX.Element} - The rendered component.
 **/

const ChangeIcons = ({
    item,
    isItemEditable = false,
    handleSetItemForEditing = () => {},
    isItemDeletable = isItemEditable,
    handleDeleteItem = () => {},
    handleDuplicateItem = () => {},
    duplicateIcon = true,
    sendToReviewIcon = false,
    handleSubmitItemForApproval = () => {},
    goToApproveIcon = false,
    handleGoToApprove = () => {}
}) => {
    if (!isItemEditable) {
        return (
            <DisabledChangeIcons
                duplicateIcon={duplicateIcon}
                sendToReviewIcon={sendToReviewIcon}
                handleDuplicateItem={() => handleDuplicateItem(item)}
            />
        );
    }

    return (
        <>
            <div className="display-flex flex-align-center">
                {isItemEditable && (
                    <Tooltip
                        label="Edit"
                        className="line-height-body-1"
                    >
                        <button
                            onClick={() => handleSetItemForEditing(item)}
                            title="Edit"
                        >
                            <FontAwesomeIcon
                                id={`edit-${item?.id}`}
                                title="Edit"
                                data-cy="edit-row"
                                icon={faPen}
                                className="text-primary height-2 width-2 margin-right-1 cursor-pointer"
                            />
                        </button>
                    </Tooltip>
                )}
                <Tooltip
                    label={`${isItemDeletable ? "Delete" : "Cannot delete"}`}
                    className="line-height-body-1"
                >
                    <button
                        onClick={() => isItemDeletable && handleDeleteItem(item.id, item.display_name)}
                        title="Delete"
                    >
                        <FontAwesomeIcon
                            id={`delete-${item?.id}`}
                            title="Delete"
                            data-cy="delete-row"
                            data-testid="delete-row"
                            icon={faTrash}
                            className={`text-primary height-2 width-2 margin-right-1 cursor-pointer ${
                                !isItemDeletable ? DISABLED_ICON_CLASSES : ""
                            }`}
                        />
                    </button>
                </Tooltip>

                {duplicateIcon && (
                    <Tooltip
                        label="Duplicate"
                        className="line-height-body-1"
                    >
                        <button
                            onClick={() => handleDuplicateItem(item)}
                            title="Duplicate"
                        >
                            <FontAwesomeIcon
                                id={`duplicate-${item?.id}`}
                                data-cy="duplicate-row"
                                icon={faClone}
                                className="text-primary height-2 width-2 cursor-pointer margin-left-0"
                            />
                        </button>
                    </Tooltip>
                )}
                {sendToReviewIcon && (
                    <Tooltip
                        label="Submit for Approval"
                        className="line-height-body-1"
                    >
                        <button
                            onClick={() => handleSubmitItemForApproval(item.id)}
                            title="Submit for Approval"
                        >
                            <svg
                                id={`submit-for-approval-${item.id}`}
                                data-cy="submit-row"
                                className="usa-icon text-primary height-205 width-205 cursor-pointer margin-left-0"
                            >
                                <use xlinkHref={`${icons}#send`}></use>
                            </svg>
                        </button>
                    </Tooltip>
                )}
                {goToApproveIcon && (
                    <Tooltip
                        label="Go to Approve"
                        className="line-height-body-1"
                    >
                        <button
                            onClick={() => handleGoToApprove(item.id)}
                            title="Go to Approve"
                        >
                            <svg
                                id={`submit-for-approval-${item.id}`}
                                data-cy="go-to-approve-row"
                                className="usa-icon text-primary height-205 width-205 cursor-pointer margin-left-0"
                            >
                                <use xlinkHref={`${icons}#check_circle`}></use>
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
    handleSetItemForEditing: PropTypes.func,
    isItemDeletable: PropTypes.bool,
    handleDeleteItem: PropTypes.func,
    handleDuplicateItem: PropTypes.func,
    duplicateIcon: PropTypes.bool,
    sendToReviewIcon: PropTypes.bool,
    handleSubmitItemForApproval: PropTypes.func
};

export default ChangeIcons;
