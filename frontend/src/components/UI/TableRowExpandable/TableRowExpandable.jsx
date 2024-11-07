import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { changeBgColorIfExpanded, removeBorderBottomIfExpanded } from "./TableRowExpandable.helpers";

/**
    @typedef {Object} TableRowExpandableProps
    @property {React.ReactNode} tableRowData - The data for the row.
    @property {React.ReactNode} expandedData - The expanded data for the row.
    @property {boolean} isExpanded - Whether the row is expanded.
    @property {Function} setIsExpanded - The setter function for isExpanded.
    @property {Function} setIsRowActive - The setter function for isRowActive.
    @property {string} [className] - The class names for the component
    @property {Object} [rest] - Additional props
*/

/**
 * @component TableRowExpandable component that represents an expandable row in a table.
 * @param {TableRowExpandableProps} props - The props for the TableRowExpandable component.
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

export default TableRowExpandable;
