import React from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { faClone } from "@fortawesome/free-regular-svg-icons";
import { DISABLED_ICON_CLASSES } from "./DisabledChangeIcons.constants";
import icons from "../../../uswds/img/sprite.svg";

/**
 * This component displays the disabled change icons for a table row.
 * @param {object} props - The component props.
 * @param {boolean} [props.duplicateIcon] - Whether to show the duplicate icon.
 * @param {function} [props.handleDuplicateItem] - The function to duplicate the budget line.
 * @param {boolean} [props.sendToReviewIcon] - Whether to show the send to review icon.
 * @returns {React.JSX.Element} - The rendered component.
 **/
const DisabledChangeIcons = ({ duplicateIcon = true, handleDuplicateItem = () => {}, sendToReviewIcon = false }) => {
    const classes = `text-primary height-2 width-2 margin-right-1 cursor-pointer usa-tooltip ${DISABLED_ICON_CLASSES}`;
    const rowId = React.useId();
    return (
        <div className="display-flex flex-align-center">
            <>
                <FontAwesomeIcon
                    id={`edit-${rowId}`}
                    data-cy="edit-row"
                    icon={faPen}
                    className={classes}
                    title="cannot edit"
                    data-position="top"
                />
                <FontAwesomeIcon
                    id={`delete-${rowId}`}
                    data-cy="delete-row"
                    data-testid="delete-row"
                    icon={faTrash}
                    title="cannot delete"
                    data-position="top"
                    className={classes}
                />
            </>
            {duplicateIcon && (
                <FontAwesomeIcon
                    id={`duplicate-${rowId}`}
                    data-cy="duplicate-row"
                    icon={faClone}
                    title="duplicate"
                    data-position="top"
                    className="text-primary height-2 width-2 cursor-pointer usa-tooltip margin-left-0"
                    onClick={handleDuplicateItem}
                />
            )}
            {sendToReviewIcon && (
                <svg
                    id={`submit-for-approval-${rowId}`}
                    data-cy="submit-row"
                    className={`usa-icon text-primary height-205 width-205 cursor-pointer margin-left-0 ${DISABLED_ICON_CLASSES}`}
                >
                    <use xlinkHref={`${icons}#send`}></use>
                </svg>
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
