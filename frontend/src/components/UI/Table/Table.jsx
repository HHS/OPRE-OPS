import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./table.module.css";
/**
 * @typedef {Object} TableHeading
 * @property {string} heading - The heading to display.
 * @property {string} value - The value to display.
 */

/**
 * The Table component is a layout component that displays a table
 * with the specified headings.
 * @typedef {Object} TableProps
 * @property {React.ReactNode} [children] - The children to render - optional.
 * @property {TableHeading[]} tableHeadings - The table headings to display.
 * @property {React.ReactNode} [firstHeadingSlot] - The checkbox slot - optional.
 * @property {Function} [onClickHeader] - Function that runs when a header is clicked - optional.
 * @property {string | null} [selectedHeader] - The header that has been chosen as sort condition.
 * @property {boolean | null} [sortDescending] - Whether or not the table is sorted descending or not. Null means no special sort direction.
 */

/**
 * The Table component is a layout component that displays a table
 * with the specified headings.
 * @component
 * @param {TableProps} props - The component props.
 * @returns {React.ReactElement} - The rendered component.
 * @example
 * <Table tableHeadings={["Heading 1", "Heading 2", "Heading 3"]}>
 **/
const Table = ({ children, tableHeadings, firstHeadingSlot, onClickHeader, selectedHeader = "", sortDescending }) => {
    /**
     * Adds a width to specific columns
     * @param {TableHeading} header - The heading to check
     * @returns {object | undefined} - The width to add if the heading matches
     */
    const setColumnWidth = (header) => {
        if (header.heading === "Status") {
            return { width: "6.25rem", whiteSpace: "nowrap" };
        }
        if (header.heading === "Start" || header.heading === "End") {
            return { width: "6.25rem", whiteSpace: "nowrap" };
        }
        if (header.heading === "Type") {
            return { width: "9rem", whiteSpace: "nowrap" };
        }
        return { whiteSpace: "nowrap" };
    };

    return (
        <table className={`usa-table width-full usa-table--borderless ${styles.tableHover}`}>
            <thead>
                <tr>
                    {firstHeadingSlot && firstHeadingSlot}
                    {tableHeadings.map((header, index) => (
                        <th
                            key={index}
                            scope="col"
                            style={setColumnWidth(header)}
                            aria-sort={
                                header.value === selectedHeader ? (sortDescending ? "descending" : "ascending") : "none"
                            }
                        >
                            <button
                                data-cy={header.value}
                                className="usa-table__header__button cursor-pointer"
                                title={`Click to sort by ${header.heading}`}
                                onClick={() => {
                                    onClickHeader?.(header.value, sortDescending == null ? true : !sortDescending);
                                }}
                            >
                                {header.heading}
                                {header.value === selectedHeader && (
                                    <>
                                        {!sortDescending && (
                                            <FontAwesomeIcon
                                                icon={faArrowUp}
                                                className="margin-left-05 height-2 width-2 cursor-pointer"
                                            />
                                        )}
                                        {sortDescending && (
                                            <FontAwesomeIcon
                                                icon={faArrowDown}
                                                className="margin-left-05 height-2 width-2 cursor-pointer"
                                            />
                                        )}
                                    </>
                                )}
                            </button>
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>{children}</tbody>
        </table>
    );
};

export default Table;
