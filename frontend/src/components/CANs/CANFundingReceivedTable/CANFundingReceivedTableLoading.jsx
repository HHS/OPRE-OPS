import TableLoadingSkeleton from "../../UI/TableLoadingSkeleton";
import { CAN_FUNDING_RECEIVED_HEADERS_LIST } from "./CANFundingReceived.constants";

const COLUMN_WIDTHS = ["35%", "30%", "60%", "55%"];

/**
 * Skeleton loading state for the CAN funding received table.
 * @returns {React.ReactElement}
 */
const CANFundingReceivedTableLoading = () => (
    <TableLoadingSkeleton
        headings={CAN_FUNDING_RECEIVED_HEADERS_LIST.map(({ heading }) => heading)}
        columnWidths={COLUMN_WIDTHS}
        hasExpandableRows
        ariaLabel="Loading funding received"
    />
);

export default CANFundingReceivedTableLoading;
