import React from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { changeBgColorIfExpanded, removeBorderBottomIfExpanded } from "./TableRowExpandable.helpers";

/**
 * TableRowExpandable component that represents a single expandable row in a table.
 * @component
 * @param {Object} props - The props for the TableRowExpandable component.
 * @param {React.ReactNode} props.tableRowData - The data for the row.
 * @param {React.ReactNode} props.expandedData - The expanded data for the row.
 * @param {boolean} props.isExpanded - Whether the row is expanded.
 * @param {Function} props.setIsExpanded - The setter function for isExpanded.
 * @param {Function} props.setIsRowActive - The setter function for isRowActive.
 * @returns {JSX.Element} The TableRowExpandable component.
 */
const TableRowExpandable = ({ tableRowData, expandedData, isExpanded, setIsExpanded, setIsRowActive, ...rest }) => {
    const trId = React.useId();
    const borderExpandedStyles = removeBorderBottomIfExpanded(isExpanded);
    const bgExpandedStyles = changeBgColorIfExpanded(isExpanded);

    return (
        <>
            <tr
                {...rest}
                onMouseEnter={() => setIsRowActive(true)}
                onMouseLeave={() => !isExpanded && setIsRowActive(false)}
            >
                {tableRowData}
                <td
                    className={borderExpandedStyles}
                    style={bgExpandedStyles}
                >
                    <FontAwesomeIcon
                        id={`expand-${trId}`}
                        data-cy="expand-row"
                        data-testid="expand-row"
                        icon={isExpanded ? faChevronUp : faChevronDown}
                        className="height-2 width-2 padding-right-1 cursor-pointer"
                        onClick={() => setIsExpanded(!isExpanded)}
                    />
                </td>
            </tr>

            {isExpanded && (
                <tr
                    data-cy="expanded-data"
                    data-testid="expanded-data"
                >
                    {expandedData}
                </tr>
            )}
        </>
    );
};

TableRowExpandable.propTypes = {
    tableRowData: PropTypes.node.isRequired,
    expandedData: PropTypes.node.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    setIsExpanded: PropTypes.func.isRequired,
    setIsRowActive: PropTypes.func.isRequired
};
export default TableRowExpandable;
