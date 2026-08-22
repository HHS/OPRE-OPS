import { faClone } from "@fortawesome/free-regular-svg-icons";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getTooltipLabel } from "../../../helpers/budgetLines.helpers";
import { CHANGE_REQUESTS_TOOLTIP_LOADING } from "../../../hooks/useChangeRequests.hooks";
import Tooltip from "../../UI/USWDS/Tooltip";
import { DISABLED_ICON_CLASSES } from "./DisabledChangeIcons.constants";

/**
 * This component displays the edit, delete, and duplicate icons for a budget line.
 * @component
 * @param {object} props - The component props.
 * @param {import("../../../types/BudgetLineTypes").BudgetLine} props.item - The item or data for the row.
 * @param {boolean} props.isItemEditable - Whether the item is editable.
 * @param {string} [props.lockedMessage] - The message to display when the item is not editable.
 * @param {function} props.handleSetItemForEditing - The function to set the row item for editing.
 * @param {boolean} [props.isItemDeletable] - Whether the item is deletable.
 * @param {function} props.handleDeleteItem - The function to delete the row.
 * @param {function} [props.handleDuplicateItem] - The function to duplicate the row.
 * @param {boolean} [props.duplicateIcon] - Whether to show the duplicate icon.
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
    duplicateIcon = true
}) => {
    const disabledClasses = `text-primary height-2 width-2 margin-right-1 cursor-pointer ${DISABLED_ICON_CLASSES}`;

    const notEditableOrDeletableMsg = getTooltipLabel(item);
    const tooltipLabel =
        lockedMessage === CHANGE_REQUESTS_TOOLTIP_LOADING && notEditableOrDeletableMsg
            ? notEditableOrDeletableMsg
            : lockedMessage || notEditableOrDeletableMsg;

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
                                type="button"
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
                                    aria-hidden="true"
                                />
                            </button>
                        </Tooltip>
                        <Tooltip
                            position="top"
                            label={isItemDeletable ? "Delete" : tooltipLabel || "This budget line can't be deleted"}
                            className="line-height-body-1"
                        >
                            <button
                                type="button"
                                id={`delete-${item?.id}`}
                                title="Delete"
                                aria-label="Delete"
                                data-cy="delete-row"
                                data-testid="delete-row"
                                disabled={!isItemDeletable}
                                onClick={(e) => {
                                    if (!isItemDeletable) {
                                        e.preventDefault();
                                        return;
                                    }
                                    handleDeleteItem(item.id, item.display_name);
                                }}
                            >
                                <FontAwesomeIcon
                                    title="Delete"
                                    icon={faTrash}
                                    className={`text-primary height-2 width-2 margin-right-1 cursor-pointer ${
                                        !isItemDeletable ? DISABLED_ICON_CLASSES : ""
                                    }`}
                                    aria-hidden="true"
                                />
                            </button>
                        </Tooltip>
                    </>
                )}
                {!isItemEditable && (
                    <>
                        <Tooltip
                            position="left"
                            label={tooltipLabel}
                            className="line-height-body-1"
                        >
                            <button
                                type="button"
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
                                    aria-hidden="true"
                                />
                            </button>
                        </Tooltip>
                        <Tooltip
                            position="left"
                            label={tooltipLabel}
                            className="line-height-body-1"
                        >
                            <button
                                type="button"
                                id={`delete-${item?.id}`}
                                title="Delete"
                                aria-label="Delete"
                                data-cy="delete-row"
                                data-testid="delete-row"
                                disabled={true}
                            >
                                <FontAwesomeIcon
                                    icon={faTrash}
                                    className={disabledClasses}
                                    aria-hidden="true"
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
                            type="button"
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
                                aria-hidden="true"
                            />
                        </button>
                    </Tooltip>
                )}
                {/* NOTE: Do we ever want to not allow duplicating BLIs? */}
                {!isItemEditable && duplicateIcon && (
                    <Tooltip
                        position="left"
                        label="Duplicate"
                        className="line-height-body-1"
                    >
                        <button
                            type="button"
                            id={`duplicate-${item?.id}`}
                            title="Duplicate"
                            aria-label="Duplicate"
                            data-cy="duplicate-row"
                            data-testid="duplicate-row"
                            disabled={true}
                            onClick={() => {}}
                        >
                            <FontAwesomeIcon
                                icon={faClone}
                                className={disabledClasses}
                                aria-hidden="true"
                            />
                        </button>
                    </Tooltip>
                )}
            </div>
        </>
    );
};

export default ChangeIcons;
