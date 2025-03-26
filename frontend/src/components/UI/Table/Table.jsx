import PropTypes from "prop-types";
import styles from "./table.module.css";
import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import icons from "../../../uswds/img/sprite.svg";
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
     *
     */
    const addWidthIfStatus = (heading) => {
        if (heading === "Next Obligate By" || heading === "Status") {
            return { width: "6.25rem", whiteSpace: "nowrap" };
        }
        return { whiteSpace: "nowrap" };
    };

    return (
        <table className={`usa-table usa-table--borderless width-full ${styles.tableHover}`}>
            <thead>
                <tr>
                    {firstHeadingSlot && firstHeadingSlot}
                    {tableHeadings.map((heading, index) => (
                        <th
                            key={index}
                            scope="col"
                            onClick={() => {
                                onClickHeader(heading, sortDescending == null ? true : !sortDescending);
                            }}
                            style={addWidthIfStatus(heading)}
                        >
                            {heading}

                            {/* if its not selected display the nuetral  */}
                            {selectedHeader !== heading && (
                                <svg
                                    className="width-2 height-2 text-primary margin-left-1 cursor-pointer usa-tooltip"
                                    aria-hidden="true"
                                    focusable="false"
                                    role="img"
                                >
                                    <use href={`${icons}#sort_arrow`}></use>
                                </svg>
                            )}
                            {heading == selectedHeader && !sortDescending && (
                                <FontAwesomeIcon
                                    icon={faArrowUp}
                                    className="text-primary height-2 width-2 margin-left-1 cursor-pointer usa-tooltip"
                                    data-position="top"
                                />
                            )}
                            {heading == selectedHeader && sortDescending && (
                                <FontAwesomeIcon
                                    icon={faArrowDown}
                                    className="text-primary height-2 width-2 margin-left-1 cursor-pointer usa-tooltip"
                                    data-position="top"
                                />
                            )}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>{children}</tbody>
        </table>
    );
};

Table.propTypes = {
    children: PropTypes.node.isRequired,
    tableHeadings: PropTypes.arrayOf(PropTypes.string).isRequired,
    firstHeadingSlot: PropTypes.node,
    onClickHeader: PropTypes.func,
    selectedHeader: PropTypes.string,
    sortDescending: PropTypes.bool
};

export default Table;
