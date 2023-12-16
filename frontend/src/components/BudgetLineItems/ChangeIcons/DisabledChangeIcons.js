import React from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { faClone } from "@fortawesome/free-regular-svg-icons";
import { DISABLED_ICON_CLASSES } from "./DisabledChangeIcons.constants";
import icons from "../../../uswds/img/sprite.svg";
import { Tooltip } from "../../UI/USWDS/Tooltip";

/**
 * This component displays the disabled change icons for a table row.
 * @param {object} props - The component props.
 * @param {boolean} [props.duplicateIcon] - Whether to show the duplicate icon.
 * @param {function} [props.handleDuplicateItem] - The function to duplicate the budget line.
 * @param {boolean} [props.sendToReviewIcon] - Whether to show the send to review icon.
 * @returns {React.JSX.Element} - The rendered component.
 **/
const DisabledChangeIcons = ({
    duplicateIcon = true,
    handleDuplicateItem = () => {},
    sendToReviewIcon = false,
    lockedMessage
}) => {
    const classes = `text-primary height-2 width-2 margin-right-1 cursor-pointer ${DISABLED_ICON_CLASSES}`;
    const rowId = React.useId();
    return (
        <div className="display-flex flex-align-center">
            <Tooltip
                position="top"
                label={`${lockedMessage ? lockedMessage : "Only team members listed on this agreement can edit"} `}
                className="line-height-body-1"
            >
                <button
                    id={`edit-${rowId}`}
                    title="Edit"
                    aria-label="Edit"
                    data-cy="edit-row"
                >
                    <FontAwesomeIcon
                        icon={faPen}
                        className={classes}
                    />
                </button>
            </Tooltip>
            <Tooltip
                position="top"
                label={`${lockedMessage ? lockedMessage : "Only team members listed on this agreement can delete"}`}
                className="line-height-body-1"
            >
                <button
                    id={`delete-${rowId}`}
                    title="Delete"
                    aria-label="Delete"
                    data-cy="delete-row"
                >
                    <FontAwesomeIcon
                        icon={faTrash}
                        className={classes}
                    />
                </button>
            </Tooltip>
            {duplicateIcon && (
                <Tooltip
                    position="top"
                    label="Duplicate"
                    className="line-height-body-1"
                >
                    <button
                        id={`duplicate-${rowId}`}
                        title="Duplicate"
                        aria-label="Duplicate"
                        data-cy="duplicate-row"
                    >
                        <FontAwesomeIcon
                            icon={faClone}
                            className="text-primary height-2 width-2 cursor-pointer margin-left-0"
                            onClick={handleDuplicateItem}
                        />
                    </button>
                </Tooltip>
            )}
            {sendToReviewIcon && (
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
                        id={`submit-for-approval-${rowId}`}
                        title="Submit for Approval"
                        aria-label="Submit for Approval"
                        data-cy="submit-row"
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
    );
};

DisabledChangeIcons.propTypes = {
    duplicateIcon: PropTypes.bool,
    sendToReviewIcon: PropTypes.bool,
    handleDuplicateItem: PropTypes.func
};

export default DisabledChangeIcons;
