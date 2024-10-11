import Tooltip from "../../UI/USWDS/Tooltip";

const CANTableHead = () => {
    const availbleTooltip =
        "$ Available is the remaining amount of the total budget that is available to plan from (Total FY Budget minus budget lines in Planned, Executing or Obligated Status)";

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
                    FY
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
                    Transfer
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
                    <Tooltip label={availbleTooltip}>
                        <span>$ Available</span>
                    </Tooltip>
                </th>
            </tr>
        </thead>
    );
};

export default CANTableHead;
