import Tooltip from "../../UI/USWDS/Tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { CAN_TABLE_HEADERS } from "./CANTable.constants";
import { tableSortCodes } from "../../../helpers/utils";
const CANTableHead = ({onClickHeader, selectedHeader, sortDescending}) => {
    const fundingReceivedTooltip = `Funding Received is the amount of the CAN's
FY budget that has been received to OPRE
and it can be executed or obligated against`;
    const availableBudgetTooltip = `Available Budget is the amount of the CAN's
FY budget that has not been allocated yet
and it's available to plan from`;
    return (
        <thead>
            <tr>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                    onClick={(() => {
                        onClickHeader?.(tableSortCodes.canCodes.CAN_NAME, sortDescending == null ? true : !sortDescending)
                    })}
                >
                    {CAN_TABLE_HEADERS.CAN_NAME}
                    {tableSortCodes.canCodes.CAN_NAME === selectedHeader && (
                        <button
                            className="usa-table__header__button cursor-pointer"
                            title={`Click to sort by ${CAN_TABLE_HEADERS.CAN_NAME} in ascending or descending order`}
                        >
                            {!sortDescending && (
                                <FontAwesomeIcon
                                    icon={faArrowUp}
                                    className="text-primary height-2 width-2 cursor-pointer"
                                />
                            )}
                            {sortDescending && (
                                <FontAwesomeIcon
                                    icon={faArrowDown}
                                    className="text-primary height-2 width-2 cursor-pointer"
                                />
                            )}
                        </button>
                    )}
                </th>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                    onClick={(() => {
                        onClickHeader?.(tableSortCodes.canCodes.PORTFOLIO, sortDescending == null ? true : !sortDescending)
                    })}
                >
                    {CAN_TABLE_HEADERS.PORTFOLIO}
                    {tableSortCodes.canCodes.PORTFOLIO === selectedHeader && (
                        <button
                            className="usa-table__header__button"
                            title={`Click to sort by ${CAN_TABLE_HEADERS.PORTFOLIO} in ascending or descending order`}
                        >
                            {!sortDescending && (
                                <FontAwesomeIcon
                                    icon={faArrowUp}
                                    className="text-primary height-2 width-2 cursor-pointer"
                                />
                            )}
                            {sortDescending && (
                                <FontAwesomeIcon
                                    icon={faArrowDown}
                                    className="text-primary height-2 width-2 cursor-pointer"
                                />
                            )}
                        </button>
                    )}
                </th>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                    onClick={(() => {
                        onClickHeader?.(tableSortCodes.canCodes.ACTIVE_PERIOD, sortDescending == null ? true : !sortDescending)
                    })}
                >
                    {CAN_TABLE_HEADERS.ACTIVE_PERIOD}
                    {tableSortCodes.canCodes.ACTIVE_PERIOD === selectedHeader && (
                        <button
                            className="usa-table__header__button"
                            title={`Click to sort by ${CAN_TABLE_HEADERS.ACTIVE_PERIOD} in ascending or descending order`}
                        >
                            {!sortDescending && (
                                <FontAwesomeIcon
                                    icon={faArrowUp}
                                    className="text-primary height-2 width-2 cursor-pointer"
                                />
                            )}
                            {sortDescending && (
                                <FontAwesomeIcon
                                    icon={faArrowDown}
                                    className="text-primary height-2 width-2 cursor-pointer"
                                />
                            )}
                        </button>
                    )}
                </th>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                    onClick={(() => {
                        onClickHeader?.(tableSortCodes.canCodes.OBLIGATE_BY, sortDescending == null ? true : !sortDescending)
                    })}
                >
                    {CAN_TABLE_HEADERS.OBLIGATE_BY}
                    {tableSortCodes.canCodes.OBLIGATE_BY === selectedHeader && (
                        <button
                            className="usa-table__header__button"
                            title={`Click to sort by ${CAN_TABLE_HEADERS.OBLIGATE_BY} in ascending or descending order`}
                        >
                            {!sortDescending && (
                                <FontAwesomeIcon
                                    icon={faArrowUp}
                                    className="text-primary height-2 width-2 cursor-pointer"
                                />
                            )}
                            {sortDescending && (
                                <FontAwesomeIcon
                                    icon={faArrowDown}
                                    className="text-primary height-2 width-2 cursor-pointer"
                                />
                            )}
                        </button>
                    )}
                </th>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                    onClick={(() => {
                        onClickHeader?.(tableSortCodes.canCodes.FY_BUDGET, sortDescending == null ? true : !sortDescending)
                    })}
                >
                    {CAN_TABLE_HEADERS.FY_BUDGET}
                    {tableSortCodes.canCodes.FY_BUDGET === selectedHeader && (
                        <button
                            className="usa-table__header__button"
                            title={`Click to sort by ${CAN_TABLE_HEADERS.FY_BUDGET} in ascending or descending order`}
                        >
                            {!sortDescending && (
                                <FontAwesomeIcon
                                    icon={faArrowUp}
                                    className="text-primary height-2 width-2 cursor-pointer"
                                />
                            )}
                            {sortDescending && (
                                <FontAwesomeIcon
                                    icon={faArrowDown}
                                    className="text-primary height-2 width-2 cursor-pointer"
                                />
                            )}
                        </button>
                    )}
                </th>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                    onClick={(() => {
                        onClickHeader?.(tableSortCodes.canCodes.FUNDING_RECEIVED, sortDescending == null ? true : !sortDescending)
                    })}
                >
                    <Tooltip
                        label={fundingReceivedTooltip}
                        position="left"
                        className="text-medium"
                    >
                        <span className="text-bold">
                            {CAN_TABLE_HEADERS.FUNDING_RECEIVED}
                            {tableSortCodes.canCodes.FUNDING_RECEIVED === selectedHeader && (
                                <button
                                    className="usa-table__header__button"
                                    title={`Click to sort by ${CAN_TABLE_HEADERS.FUNDING_RECEIVED} in ascending or descending order`}
                                >
                                    {!sortDescending && (
                                        <FontAwesomeIcon
                                            icon={faArrowUp}
                                            className="text-primary height-2 width-2 cursor-pointer"
                                        />
                                    )}
                                    {sortDescending && (
                                        <FontAwesomeIcon
                                            icon={faArrowDown}
                                            className="text-primary height-2 width-2 cursor-pointer"
                                        />
                                    )}
                                </button>
                            )}
                        </span>
                    </Tooltip>
                </th>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                    onClick={(() => {
                        onClickHeader?.(tableSortCodes.canCodes.AVAILABLE_BUDGET, sortDescending == null ? true : !sortDescending)
                    })}
                >
                    <Tooltip
                        label={availableBudgetTooltip}
                        position="left"
                        className="text-medium"
                    >
                        <span className="text-bold">
                            {CAN_TABLE_HEADERS.AVAILABLE_BUDGET}
                            {tableSortCodes.canCodes.AVAILABLE_BUDGET === selectedHeader && (
                                <button
                                    className="usa-table__header__button"
                                    title={`Click to sort by ${CAN_TABLE_HEADERS.AVAILABLE_BUDGET} in ascending or descending order`}
                                >
                                    {!sortDescending && (
                                        <FontAwesomeIcon
                                            icon={faArrowUp}
                                            className="text-primary height-2 width-2 cursor-pointer"
                                        />
                                    )}
                                    {sortDescending && (
                                        <FontAwesomeIcon
                                            icon={faArrowDown}
                                            className="text-primary height-2 width-2 cursor-pointer"
                                        />
                                    )}
                                </button>
                            )}
                        </span>
                    </Tooltip>
                </th>
            </tr>
        </thead>
    );
};

export default CANTableHead;
