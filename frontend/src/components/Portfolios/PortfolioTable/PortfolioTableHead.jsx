import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { PORTFOLIO_TABLE_HEADERS, PORTFOLIO_SORT_CODES } from "./PortfolioTable.constants";

/**
 * The PortfolioTableHead component is used to display the table headers for the Portfolio table.
 * @param {Object} props - The component props.
 * @param {Function} props.onClickHeader - The function to call when a header is clicked.
 * @param {string} props.selectedHeader - The header that is currently selected.
 * @param {boolean} props.sortDescending - Whether the table is sorted in descending order.
 * @param {number} props.fiscalYear - The selected fiscal year.
 * @returns {React.ReactElement} - The rendered component.
 */
const PortfolioTableHead = ({ onClickHeader, selectedHeader, sortDescending, fiscalYear }) => {
    // Format fiscal year to last 2 digits (e.g., 2026 -> "26")
    const fyShort = fiscalYear ? String(fiscalYear).slice(-2) : "";

    return (
        <thead>
            <tr>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                    aria-sort={
                        PORTFOLIO_SORT_CODES.PORTFOLIO_NAME === selectedHeader
                            ? sortDescending
                                ? "descending"
                                : "ascending"
                            : "none"
                    }
                >
                    <button
                        className="usa-table__header__button cursor-pointer"
                        title={`Click to sort by ${PORTFOLIO_TABLE_HEADERS.PORTFOLIO_NAME} in ascending or descending order`}
                        onClick={() => {
                            onClickHeader?.(
                                PORTFOLIO_SORT_CODES.PORTFOLIO_NAME,
                                sortDescending == null ? true : !sortDescending
                            );
                        }}
                    >
                        {PORTFOLIO_TABLE_HEADERS.PORTFOLIO_NAME}
                        {PORTFOLIO_SORT_CODES.PORTFOLIO_NAME === selectedHeader && (
                            <>
                                {!sortDescending && (
                                    <FontAwesomeIcon
                                        icon={faArrowUp}
                                        className="height-2 width-2 cursor-pointer"
                                    />
                                )}
                                {sortDescending && (
                                    <FontAwesomeIcon
                                        icon={faArrowDown}
                                        className="height-2 width-2 cursor-pointer"
                                    />
                                )}
                            </>
                        )}
                    </button>
                </th>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                    aria-sort={
                        PORTFOLIO_SORT_CODES.FY_BUDGET === selectedHeader
                            ? sortDescending
                                ? "descending"
                                : "ascending"
                            : "none"
                    }
                >
                    <button
                        className="usa-table__header__button cursor-pointer"
                        title={`Click to sort by FY ${fyShort} Budget in ascending or descending order`}
                        onClick={() => {
                            onClickHeader?.(
                                PORTFOLIO_SORT_CODES.FY_BUDGET,
                                sortDescending == null ? true : !sortDescending
                            );
                        }}
                    >
                        {`FY ${fyShort} Budget`}
                        {PORTFOLIO_SORT_CODES.FY_BUDGET === selectedHeader && (
                            <>
                                {!sortDescending && (
                                    <FontAwesomeIcon
                                        icon={faArrowUp}
                                        className="height-2 width-2 cursor-pointer"
                                    />
                                )}
                                {sortDescending && (
                                    <FontAwesomeIcon
                                        icon={faArrowDown}
                                        className="height-2 width-2 cursor-pointer"
                                    />
                                )}
                            </>
                        )}
                    </button>
                </th>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                    aria-sort={
                        PORTFOLIO_SORT_CODES.FY_SPENDING === selectedHeader
                            ? sortDescending
                                ? "descending"
                                : "ascending"
                            : "none"
                    }
                >
                    <button
                        className="usa-table__header__button cursor-pointer"
                        title={`Click to sort by FY ${fyShort} Spending in ascending or descending order`}
                        onClick={() => {
                            onClickHeader?.(
                                PORTFOLIO_SORT_CODES.FY_SPENDING,
                                sortDescending == null ? true : !sortDescending
                            );
                        }}
                    >
                        {`FY ${fyShort} Spending`}
                        {PORTFOLIO_SORT_CODES.FY_SPENDING === selectedHeader && (
                            <>
                                {!sortDescending && (
                                    <FontAwesomeIcon
                                        icon={faArrowUp}
                                        className="height-2 width-2 cursor-pointer"
                                    />
                                )}
                                {sortDescending && (
                                    <FontAwesomeIcon
                                        icon={faArrowDown}
                                        className="height-2 width-2 cursor-pointer"
                                    />
                                )}
                            </>
                        )}
                    </button>
                </th>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                    aria-sort={
                        PORTFOLIO_SORT_CODES.FY_AVAILABLE === selectedHeader
                            ? sortDescending
                                ? "descending"
                                : "ascending"
                            : "none"
                    }
                >
                    <button
                        className="usa-table__header__button cursor-pointer"
                        title={`Click to sort by FY ${fyShort} Available Budget in ascending or descending order`}
                        onClick={() => {
                            onClickHeader?.(
                                PORTFOLIO_SORT_CODES.FY_AVAILABLE,
                                sortDescending == null ? true : !sortDescending
                            );
                        }}
                    >
                        {`FY ${fyShort} Available Budget`}
                        {PORTFOLIO_SORT_CODES.FY_AVAILABLE === selectedHeader && (
                            <>
                                {!sortDescending && (
                                    <FontAwesomeIcon
                                        icon={faArrowUp}
                                        className="height-2 width-2 cursor-pointer"
                                    />
                                )}
                                {sortDescending && (
                                    <FontAwesomeIcon
                                        icon={faArrowDown}
                                        className="height-2 width-2 cursor-pointer"
                                    />
                                )}
                            </>
                        )}
                    </button>
                </th>
            </tr>
        </thead>
    );
};

export default PortfolioTableHead;
