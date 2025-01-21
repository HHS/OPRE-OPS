import Table from "../../UI/Table";
import CANFundingReceivedTableRow from "./CANFundingReceivedTableRow";

/**
 * @typedef {import("../../../components/CANs/CANTypes").FundingReceived} FundingReceived
 */

/**
 * @typedef {Object} CANFundingReceivedTableProps
 * @property {string} totalFunding
 * @property {FundingReceived[]} fundingReceived data for table
 */

/**
 * @component - The CAN Funding component.
 * @param {CANFundingReceivedTableProps} props
 * @returns  {JSX.Element} - The component JSX.
 */
const CANFundingReceivedTable = ({ fundingReceived, totalFunding }) => {
    return (
        <Table tableHeadings={["Funding ID", "FY", "Funding Received", "% of Total FY Budget"]}>
            {fundingReceived.map((fundingRow) => {
                return (
                    <CANFundingReceivedTableRow
                        key={fundingRow.id}
                        fundingReceived={fundingRow}
                        totalFunding={totalFunding}
                    />
                );
            })}
        </Table>
    );
};

export default CANFundingReceivedTable;
