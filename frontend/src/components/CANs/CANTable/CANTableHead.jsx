import Tooltip from "../../UI/USWDS/Tooltip";

const CANTableHead = () => {
    const availableBudgetTooltip =
        "Available Budget is the amount of the CAN's FY budget that has not been allocated yet and it's available to plan from";
    const fundingReceivedTooltip =
        "Funding Received is the amount of the CAN's FY budget that has been received to OPRE and it can be executed or obligated against";

    return (
        <thead>
            <tr>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                >
                    CAN
                </th>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                >
                    Portfolio
                </th>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                >
                    Active Period
                </th>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                >
                    Obligate By
                </th>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                >
                    FY Budget
                </th>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                >
                    <Tooltip
                        label={fundingReceivedTooltip}
                        position="left"
                    >
                        <span>Funding Received</span>
                    </Tooltip>
                </th>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                >
                    <Tooltip
                        label={availableBudgetTooltip}
                        position="left"
                    >
                        <span>Available Budget</span>
                    </Tooltip>
                </th>
            </tr>
        </thead>
    );
};

export default CANTableHead;
