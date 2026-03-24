import { ITEMS_PER_PAGE } from "../../../constants";
import styles from "./TableLoadingSkeleton.module.scss";

/**
 * A single shimmering pill placeholder cell.
 * @param {Object} props
 * @param {string} [props.width="80%"] - CSS width of the pill.
 * @returns {React.ReactElement}
 */
const SkeletonCell = ({ width = "80%" }) => (
    <td>
        <span
            className={styles.skeleton}
            style={{ width, height: "1rem", display: "block" }}
            data-testid="skeleton-cell-pill"
            aria-hidden="true"
        />
    </td>
);

/**
 * A skeleton chevron placeholder cell matching the expand column from TableRowExpandable.
 * @returns {React.ReactElement}
 */
const SkeletonChevronCell = () => (
    <td style={{ width: "2rem" }}>
        <span
            className={styles.skeleton}
            style={{ width: "0.75rem", height: "0.75rem", display: "inline-block", borderRadius: "2px" }}
            aria-hidden="true"
        />
    </td>
);

/**
 * A generic skeleton loading table with shimmer animation.
 *
 * Renders a `<thead>` with the supplied column headings and `rowCount` skeleton
 * rows whose cell widths are controlled by `columnWidths`.
 *
 * @param {Object} props
 * @param {string[]} props.headings - Column header labels to display in `<thead>`.
 * @param {string[]} [props.columnWidths] - CSS widths for each skeleton pill, one per column.
 *   Defaults to "80%" for every column when omitted.
 * @param {number} [props.rowCount=ITEMS_PER_PAGE] - Number of skeleton rows to render.
 * @param {boolean} [props.hasExpandableRows=false] - When true, appends a chevron placeholder
 *   cell to every row (and an empty `<th>` to the header), matching the TableRowExpandable pattern.
 * @param {string} [props.ariaLabel="Loading data"] - Accessible label for the `<table>` element.
 * @returns {React.ReactElement}
 */
const TableLoadingSkeleton = ({
    headings,
    columnWidths,
    rowCount = ITEMS_PER_PAGE,
    hasExpandableRows = false,
    ariaLabel = "Loading data"
}) => {
    const widths = columnWidths ?? headings.map(() => "80%");

    return (
        <table
            className="usa-table usa-table--borderless width-full"
            aria-label={ariaLabel}
            aria-busy="true"
        >
            <thead>
                <tr>
                    {headings.map((heading) => (
                        <th
                            key={heading}
                            scope="col"
                            style={{ whiteSpace: "nowrap" }}
                        >
                            {heading}
                        </th>
                    ))}
                    {hasExpandableRows && (
                        <th scope="col">
                            <span className="usa-sr-only">Expand row</span>
                        </th>
                    )}
                </tr>
            </thead>
            <tbody>
                {Array.from({ length: rowCount }, (_, i) => (
                    <tr key={i}>
                        {widths.map((width, j) => (
                            <SkeletonCell
                                key={j}
                                width={width}
                            />
                        ))}
                        {hasExpandableRows && <SkeletonChevronCell />}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default TableLoadingSkeleton;
