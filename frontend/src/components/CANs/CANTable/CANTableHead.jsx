import Tooltip from "../../UI/USWDS/Tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { CAN_TABLE_HEADERS } from "./CANTable.constants";
const CANTableHead = (onClickHeader, selectedHeader, sortDescending) => {
    const fundingReceivedTooltip = `Funding Received is the amount of the CAN's
FY budget that has been received to OPRE
and it can be executed or obligated against`;
    const availableBudgetTooltip = `Available Budget is the amount of the CAN's
FY budget that has not been allocated yet
and it's available to plan from`;
    console.log(selectedHeader);
    return (
        <thead>
            <tr>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                    onClick={(() => {
                        onClickHeader?.(CAN_TABLE_HEADERS.CAN_NAME, sortDescending == null ? true : !sortDescending)
                    })}
                >
                    {CAN_TABLE_HEADERS.CAN_NAME}
                    {CAN_TABLE_HEADERS.CAN_NAME === selectedHeader && (
                        <button
                            className="usa-table__header__button"
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
                        onClickHeader?.(CAN_TABLE_HEADERS.PORTFOLIO, sortDescending == null ? true : !sortDescending)
                    })}
                >
                    {CAN_TABLE_HEADERS.PORTFOLIO}
                </th>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                    onClick={(() => {
                        onClickHeader?.(CAN_TABLE_HEADERS.ACTIVE_PERIOD, sortDescending == null ? true : !sortDescending)
                    })}
                >
                    {CAN_TABLE_HEADERS.ACTIVE_PERIOD}
                </th>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                    onClick={(() => {
                        onClickHeader?.(CAN_TABLE_HEADERS.OBLIGATE_BY, sortDescending == null ? true : !sortDescending)
                    })}
                >
                    {CAN_TABLE_HEADERS.OBLIGATE_BY}
                </th>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                    onClick={(() => {
                        onClickHeader?.(CAN_TABLE_HEADERS.FY_BUDGET, sortDescending == null ? true : !sortDescending)
                    })}
                >
                    {CAN_TABLE_HEADERS.FY_BUDGET}
                </th>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                    onClick={(() => {
                        onClickHeader?.(CAN_TABLE_HEADERS.FUNDING_RECEIVED, sortDescending == null ? true : !sortDescending)
                    })}
                >
                    <Tooltip
                        label={fundingReceivedTooltip}
                        position="left"
                        className="text-medium"
                    >
                        <span className="text-bold">{CAN_TABLE_HEADERS.FUNDING_RECEIVED}</span>
                    </Tooltip>
                </th>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                >
                    <Tooltip
                        label={availableBudgetTooltip}
                        position="left"
                        className="text-medium"
                        onClick={(() => {
                            onClickHeader?.(CAN_TABLE_HEADERS.AVAILABLE_BUDGET, sortDescending == null ? true : !sortDescending)
                        })}
                    >
                        <span className="text-bold">{CAN_TABLE_HEADERS.AVAILABLE_BUDGET}</span>
                    </Tooltip>
                </th>
            </tr>
        </thead>
    );
};

export default CANTableHead;
