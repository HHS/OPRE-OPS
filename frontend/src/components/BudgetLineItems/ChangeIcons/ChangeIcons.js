import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { faClone } from "@fortawesome/free-regular-svg-icons";
import DisabledChangeIcons from "./DisabledChangeIcons";
import { DISABLED_ICON_CLASSES } from "./DisabledChangeIcons.constants";
import icons from "../../../uswds/img/sprite.svg";

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
                    <FontAwesomeIcon
                        id={`edit-${item?.id}`}
                        data-cy="edit-row"
                        icon={faPen}
                        className="text-primary height-2 width-2 margin-right-1 cursor-pointer usa-tooltip"
                        title="edit"
                        data-position="top"
                        onClick={() => handleSetItemForEditing(item)}
                    />
                )}
                <FontAwesomeIcon
                    id={`delete-${item?.id}`}
                    data-cy="delete-row"
                    data-testid="delete-row"
                    icon={faTrash}
                    title={`${isItemDeletable ? "delete" : "cannot delete"}`}
                    data-position="top"
                    className={`text-primary height-2 width-2 margin-right-1 cursor-pointer usa-tooltip ${
                        !isItemDeletable ? DISABLED_ICON_CLASSES : ""
                    }`}
                    onClick={() => isItemDeletable && handleDeleteItem(item.id, item.display_name)}
                />

                {duplicateIcon && (
                    <FontAwesomeIcon
                        id={`duplicate-${item?.id}`}
                        data-cy="duplicate-row"
                        icon={faClone}
                        title="duplicate"
                        data-position="top"
                        className="text-primary height-2 width-2 cursor-pointer usa-tooltip margin-left-0"
                        onClick={() => handleDuplicateItem(item)}
                    />
                )}
                {sendToReviewIcon && (
                    <svg
                        id={`submit-for-approval-${item.id}`}
                        data-cy="submit-row"
                        className="usa-icon text-primary height-205 width-205 cursor-pointer margin-left-0 margin-right-05"
                        onClick={() => handleSubmitItemForApproval(item.id)}
                    >
                        <use xlinkHref={`${icons}#send`}></use>
                    </svg>
                )}
                {goToApproveIcon && (
                    <svg
                        id={`submit-for-approval-${item.id}`}
                        data-cy="go-to-approve-row"
                        className="usa-icon text-primary height-205 width-205 cursor-pointer margin-left-0"
                        onClick={() => handleGoToApprove(item.id)}
                    >
                        <use xlinkHref={`${icons}#check_circle`}></use>
                    </svg>
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
