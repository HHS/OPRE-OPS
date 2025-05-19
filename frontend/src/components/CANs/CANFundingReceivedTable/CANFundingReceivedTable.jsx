import Table from "../../UI/Table";
import CANFundingReceivedTableRow from "./CANFundingReceivedTableRow";
import _ from "lodash";
import { CAN_FUNDING_RECEIVED_HEADERS_LIST } from "./CANFundingReceived.constants";
import { useSortData, SORT_TYPES } from "../../../hooks/use-sortable-data.hooks";
import { useSetSortConditions } from "../../UI/Table/Table.hooks";
/**
 * @typedef {import("../../../types/CANTypes").FundingReceived} FundingReceived
 */

/**
 * @typedef {Object} CANFundingReceivedTableProps
 * @property {number} totalFunding
 * @property {FundingReceived[]} fundingReceived data for table
 * @property {boolean} isEditMode for if we're in edit mode
 * @property {(id: number | string) => void} populateFundingReceivedForm function for editing funding received
 * @property {(fundingReceivedId: number | string) => void} deleteFundingReceived
 */

/**
 * @component - The CAN Funding component.
 * @param {CANFundingReceivedTableProps} props
 * @returns  {React.ReactElement} - The component JSX.
 */
const CANFundingReceivedTable = ({
    fundingReceived,
    totalFunding,
    isEditMode,
    populateFundingReceivedForm,
    deleteFundingReceived
}) => {
    const { sortDescending, sortCondition, setSortConditions } = useSetSortConditions();

    let copiedFunding = _.cloneDeep(fundingReceived);
    // @ts-ignore
    copiedFunding.forEach((funding) => (funding.totalFunding = totalFunding));
    copiedFunding = useSortData(copiedFunding, sortDescending, sortCondition, SORT_TYPES.CAN_FUNDING_RECEIVED);
    return (
        <Table
            tableHeadings={CAN_FUNDING_RECEIVED_HEADERS_LIST}
            sortDescending={sortDescending}
            selectedHeader={sortCondition}
            onClickHeader={setSortConditions}
        >
            {copiedFunding.map((fundingRow, index) => {
                return (
                    <CANFundingReceivedTableRow
                        key={`fundingRow.id-${index}`}
                        fundingReceived={fundingRow}
                        totalFunding={totalFunding}
                        isEditMode={isEditMode}
                        populateFundingReceivedForm={populateFundingReceivedForm}
                        deleteFundingReceived={deleteFundingReceived}
                    />
                );
            })}
        </Table>
    );
};

export default CANFundingReceivedTable;
