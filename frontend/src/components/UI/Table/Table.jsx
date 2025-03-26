import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import icons from "../../../uswds/img/sprite.svg";
import styles from "./table.module.css";
/**
 * The Table component is a layout component that displays a table
 * with the specified headings.
 * @component
 * @param {object} props - The component props.
 * @param {React.ReactNode} [props.children] - The children to render - optional.
 * @param {string[]} props.tableHeadings - The table headings to display.
 * @param {React.ReactNode} [props.firstHeadingSlot] - The checkbox slot - optional.
 * @param {(arg1: string|null, arg2: boolean|null) => void} [props.onClickHeader] - Function that runs when a header is clicked - optional.
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
    const addWidthIfStatus = (heading) => {
        if (heading === "Next Obligate By" || heading === "Status") {
            return { width: "6.25rem", whiteSpace: "nowrap" };
        }
        return { whiteSpace: "nowrap" };
    };

    return (
        <div className="usa-table-container--scrollable">
            <table
                className={`usa-table width-full usa-table--borderless ${styles.tableHover}`}
                style={{ width: "920px" }}
            >
                <thead>
                    <tr>
                        {firstHeadingSlot && firstHeadingSlot}
                        {tableHeadings.map((heading, index) => (
                            <th
                                key={index}
                                scope="col"
                                role="columnheader"
                                onClick={() => {
                                    onClickHeader?.(heading, sortDescending == null ? true : !sortDescending);
                                }}
                                style={addWidthIfStatus(heading)}
                                data-sortable={heading}
                            >
                                {heading}

                                <button
                                    className="usa-table__header__button"
                                    title={`Click to sort by ${heading} in ascending or descending order.`}
                                >
                                    {selectedHeader !== heading && (
                                        <svg
                                            className="width-205 height-205 text-primary cursor-pointer"
                                            aria-hidden="true"
                                            focusable="false"
                                            viewBox="0 0 16 16"
                                            role="img"
                                            fill="currentColor"
                                        >
                                            <use href={`${icons}#sort_arrow`}></use>
                                        </svg>
                                    )}
                                    {heading == selectedHeader && !sortDescending && (
                                        <FontAwesomeIcon
                                            icon={faArrowUp}
                                            className="text-primary height-2 width-2 cursor-pointer"
                                        />
                                    )}
                                    {heading == selectedHeader && sortDescending && (
                                        <FontAwesomeIcon
                                            icon={faArrowDown}
                                            className="text-primary height-2 width-2 cursor-pointer"
                                        />
                                    )}
                                </button>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>{children}</tbody>
            </table>
        </div>
    );
};

export default Table;
