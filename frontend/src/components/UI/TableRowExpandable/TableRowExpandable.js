import React from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";

/**
 * TableRowExpandable component that represents a single expandable row in a table.
 * @param {Object} props - The props for the TableRowExpandable component.
 * @param {React.ReactNode} props.tableRowData - The data for the row.
 * @param {React.ReactNode} props.expandedData - The expanded data for the row.
 * @param {boolean} props.isExpanded - Whether the row is expanded.
 * @param {Function} props.setIsExpanded - The setter function for isExpanded.
 * @param {boolean} props.isRowActive - Whether the row is active.
 * @param {Function} props.setIsRowActive - The setter function for isRowActive.
 * @returns {React.JSX.Element} The TableRowExpandable component.
 */
const TableRowExpandable = ({ tableRowData, expandedData, isExpanded, setIsExpanded, isRowActive, setIsRowActive }) => {
    const trId = React.useId();
    const removeBorderBottomIfExpanded = isExpanded ? "border-bottom-none" : undefined;
    const changeBgColorIfExpanded = { backgroundColor: isRowActive && "#F0F0F0" };
    const handleExpandRow = () => {
        setIsExpanded(!isExpanded);
        setIsRowActive(!isRowActive);
    };

    return (
        <>
            <tr>
                {tableRowData}
                <td className={removeBorderBottomIfExpanded} style={changeBgColorIfExpanded}>
                    <FontAwesomeIcon
                        id={`expand-${trId}`}
                        data-cy="expand-row"
                        icon={isExpanded ? faChevronUp : faChevronDown}
                        className="height-2 width-2 padding-right-1 cursor-pointer"
                        onClick={handleExpandRow}
                    />
                </td>
            </tr>

            {isExpanded && <tr>{expandedData}</tr>}
        </>
    );
};

TableRowExpandable.propTypes = {
    tableRowData: PropTypes.node.isRequired,
    expandedData: PropTypes.node.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    setIsExpanded: PropTypes.func.isRequired,
    isRowActive: PropTypes.bool.isRequired,
    setIsRowActive: PropTypes.func.isRequired,
};
export default TableRowExpandable;
