import TableRowExpandable from "../../../components/UI/TableRowExpandable";
import {
    changeBgColorIfExpanded,
    expandedRowBGColor,
    removeBorderBottomIfExpanded
} from "../../../components/UI/TableRowExpandable/TableRowExpandable.helpers";
import { useTableRow } from "../../../components/UI/TableRowExpandable/TableRowExpandable.hooks";

/**
 * WhatsNextTableRow component renders a table row for the "What's Next" table,
 * supporting expandable rows to show additional details.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {Object} props.item - The data object representing a row item.
 * @param {string|number} props.item.priority - The priority value for the row.
 * @param {string} props.item.title - The title of the row item.
 * @param {string|number} props.item.levelOfEffort - The level of effort for the row item.
 * @param {string} props.item.status - The status of the row item.
 * @param {string} props.item.expandedHeading - The heading shown in the expanded row.
 * @param {string} props.item.expandedDescription - The description shown in the expanded row.
 * @returns {React.ReactElement} The rendered table row, expandable to show more details.
 */
const WhatsNextTableRow = ({ item }) => {
    const { isExpanded, setIsExpanded, setIsRowActive } = useTableRow();
    // styles for the table row
    const borderExpandedStyles = removeBorderBottomIfExpanded(isExpanded);
    const bgExpandedStyles = changeBgColorIfExpanded(isExpanded);
    const TableRowData = (
        <>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                {item.priority}
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                {item.title}
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                {item.levelOfEffort}
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                {item.status}
            </td>
        </>
    );

    const ExpandedData = (
        <td
            colSpan={9}
            className="border-top-none"
            style={expandedRowBGColor}
        >
            {item.expandedDescription && item.expandedHeading ? (
                <dl className="font-12px">
                    <dt className="margin-0 text-base-dark">{item.expandedHeading}</dt>
                    <dd className="margin-0">{item.expandedDescription}</dd>
                </dl>
            ) : (
                <p className="font-12px margin-0">No additional information available.</p>
            )}
        </td>
    );

    return (
        <TableRowExpandable
            tableRowData={TableRowData}
            expandedData={ExpandedData}
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
            setIsRowActive={setIsRowActive}
        />
    );
};

export default WhatsNextTableRow;
