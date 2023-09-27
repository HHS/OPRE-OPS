import React from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { faClone } from "@fortawesome/free-regular-svg-icons";
import { DISABLED_ICON_CLASSES } from "../../../constants";

/**
 * This component displays the disabled change icons for a table row.
 * @param {object} props - The component props.
 * @param {boolean} [props.duplicateIcon] - Whether to show the duplicate icon.
 * @param {function} [props.handleDuplicateBudgetLine] - The function to duplicate the budget line.
 * @returns {React.JSX.Element} - The rendered component.
 **/
const DisabledChangeIcons = ({
    duplicateIcon = true,
    handleDuplicateBudgetLine = () => {
        alert("not implemented");
    }
}) => {
    const classes = `text-primary height-2 width-2 margin-right-1 cursor-pointer usa-tooltip ${DISABLED_ICON_CLASSES}`;
    const rowId = React.useId();
    return (
        <>
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
                    onClick={handleDuplicateBudgetLine}
                />
            )}
        </>
    );
};

DisabledChangeIcons.propTypes = {
    duplicateIcon: PropTypes.bool,
    handleDuplicateBudgetLine: PropTypes.func
};

export default DisabledChangeIcons;
