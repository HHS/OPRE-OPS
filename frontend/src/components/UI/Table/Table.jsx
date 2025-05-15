import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./table.module.css";
/**
 * The Table component is a layout component that displays a table
 * with the specified headings.
 * @component
 * @param {object} props - The component props.
 * @param {React.ReactNode} [props.children] - The children to render - optional.
 * @param {object[]} props.tableHeadings - The table headings to display.
 * @param {React.ReactNode} [props.firstHeadingSlot] - The checkbox slot - optional.
 * @param {Function} [props.onClickHeader] - Function that runs when a header is clicked - optional.
 * @param {string | null} [props.selectedHeader] - The header that has been chosen as sort condition.
 * @param {boolean | null} [props.sortDescending] - Whether or not the table is sorted descending or not. Null means no special sort direction.
 * @returns {JSX.Element} - The rendered component.
 * @example
 * <Table tableHeadings={["Heading 1", "Heading 2", "Heading 3"]}>
 **/
const Table = ({ children, tableHeadings, firstHeadingSlot, onClickHeader, selectedHeader = "", sortDescending }) => {
    /**
     * Adds a width to the Status column
     * @param {string} heading - The heading to check
     * @returns {object | undefined} - The width to add if the heading is Status
     */
    const addWidthIfStatus = (header) => {
        if (header.heading === "Next Obligate By" || header.heading === "Status") {
            return { width: "6.25rem", whiteSpace: "nowrap" };
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
                            role="columnheader"
                            onClick={() => {
                                onClickHeader?.(header.value, sortDescending == null ? true : !sortDescending);
                            }}
                            style={addWidthIfStatus(header)}
                        >
                            <button
                                className="usa-table__header__button cursor-pointer"
                                title={`Click to sort by ${header.heading}`}
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
