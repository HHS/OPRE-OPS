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
 * @returns {React.JSX.Element} - The rendered component.
 **/
const DisabledChangeIcons = ({ duplicateIcon = true }) => {
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
                    title="cannot duplicate"
                    data-position="top"
                    className={`${classes} margin-right-0`}
                />
            )}
        </>
    );
};

DisabledChangeIcons.propTypes = {
    duplicateIcon: PropTypes.bool,
};

export default DisabledChangeIcons;
