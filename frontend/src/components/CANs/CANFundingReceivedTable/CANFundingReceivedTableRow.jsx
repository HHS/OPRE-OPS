import { faClock } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CurrencyFormat from "react-currency-format";
import { NO_DATA } from "../../../constants";
import { calculatePercent, formatDateToMonthDayYear } from "../../../helpers/utils";
import ChangeIcons from "../../BudgetLineItems/ChangeIcons";
import TableRowExpandable from "../../UI/TableRowExpandable";
import {
    changeBgColorIfExpanded,
    expandedRowBGColor,
    removeBorderBottomIfExpanded
} from "../../UI/TableRowExpandable/TableRowExpandable.helpers";
import { useTableRow } from "../../UI/TableRowExpandable/TableRowExpandable.hooks";

/**
 * @typedef {import("../../../components/CANs/CANTypes").FundingReceived} FundingReceived
 */

/**
 * @typedef {Object} CANFundingReceivedTableRowProps
 * @property {string} totalFunding
 * @property {FundingReceived} fundingReceived data for table
 * @property {boolean} isEditMode for if we're in edit mode
 * @property {(id: number | string) => void} populateFundingReceivedForm function for editing funding received
 * @property {(tempRowId: string | number ) => void} deleteFundingReceived
 */

/**
 * @component - The CAN Funding component.
 * @param {CANFundingReceivedTableRowProps} props
 * @returns  {JSX.Element} - The component JSX.
 */

const CANFundingReceivedTableRow = ({
    fundingReceived,
    totalFunding,
    isEditMode,
    populateFundingReceivedForm,
    deleteFundingReceived
}) => {
    const { isRowActive, isExpanded, setIsExpanded, setIsRowActive } = useTableRow();
    const borderExpandedStyles = removeBorderBottomIfExpanded(isExpanded);
    const bgExpandedStyles = changeBgColorIfExpanded(isExpanded);
    const tempRowId = (fundingReceived.id?.toString() === NO_DATA ? fundingReceived.tempId : fundingReceived.id) ?? -1;

    /**
     * Component for displaying funding received data in a table format
     * @component ExpandedData - Displays additional details when a row is expanded
     * @param {Object} props
     * @param {string} props.createdBy - Name of user who created the funding entry
     * @param {string} props.createdOn - Date when funding entry was created
     * @param {string} [props.notes] - Additional notes for the funding entry
     * @returns {JSX.Element} Table cell containing expanded details
     */
    const ExpandedData = ({ createdBy, createdOn, notes }) => (
        <td
            colSpan={9}
            className="border-top-none"
            style={expandedRowBGColor}
        >
            <div className="display-flex padding-right-9">
                <dl className="font-12px">
                    <dt className="margin-0 text-base-dark">Created By</dt>
                    <dd
                        id={`created-by-name`}
                        className="margin-0"
                    >
                        {createdBy ?? NO_DATA}
                    </dd>
                    <dt className="margin-0 text-base-dark display-flex flex-align-center margin-top-2">
                        <FontAwesomeIcon
                            icon={faClock}
                            className="height-2 width-2 margin-right-1"
                        />
                        {formatDateToMonthDayYear(createdOn)}
                    </dt>
                </dl>
                <dl
                    className="font-12px"
                    style={{ marginLeft: "9.0625rem" }}
                >
                    <dt className="margin-0 text-base-dark">Notes</dt>
                    <dd
                        className="margin-0"
                        style={{ maxWidth: "400px" }}
                    >
                        {notes ?? "No notes added."}
                    </dd>
                </dl>
            </div>
        </td>
    );

    /**
     * @component TableRowData component renders a table row
     * @param {Object} props - The properties object.
     * @param {number | string} props.rowId - The label of the row.
     * @param {number} props.fiscalYear - The fiscal year for the funding data.
     * @param {number} [props.funding] - The amount of funding received.
     * @param {number} props.totalFunding - The total funding available.
     * @returns {JSX.Element} The rendered table row data.
     */
    const TableRowData = ({ rowId, fiscalYear, funding = 0, totalFunding }) => (
        <>
            <td
                className={`${borderExpandedStyles}`}
                style={bgExpandedStyles}
            >
                {rowId}
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                {fiscalYear}
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                <CurrencyFormat
                    value={funding}
                    displayType={"text"}
                    thousandSeparator={true}
                    prefix={"$"}
                    decimalScale={2}
                    fixedDecimalScale
                />
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                {calculatePercent(funding, totalFunding)}%
            </td>
            {isRowActive && isEditMode ? (
                <td
                    className={borderExpandedStyles}
                    style={bgExpandedStyles}
                >
                    <ChangeIcons
                        item={{ id: tempRowId, display_name: "Funding Received Item" }}
                        handleDeleteItem={() => {
                            deleteFundingReceived(tempRowId);
                        }}
                        handleSetItemForEditing={() => {
                            populateFundingReceivedForm(tempRowId);
                        }}
                        isItemEditable={true}
                        isItemDeletable={true}
                        duplicateIcon={false}
                    />
                </td>
            ) : (
                <td
                    className={borderExpandedStyles}
                    style={bgExpandedStyles}
                    width="113px"
                    aria-label="Actions column"
                ></td> // empty cell to maintain alignment
            )}
        </>
    );
    return (
        <TableRowExpandable
            tableRowData={
                <TableRowData
                    rowId={fundingReceived.id}
                    fiscalYear={fundingReceived.fiscal_year}
                    funding={fundingReceived.funding}
                    totalFunding={+totalFunding}
                />
            }
            expandedData={
                <ExpandedData
                    createdBy={fundingReceived.created_by_user?.full_name}
                    createdOn={fundingReceived.created_on}
                    notes={fundingReceived.notes}
                />
            }
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
            setIsRowActive={setIsRowActive}
        />
    );
};

export default CANFundingReceivedTableRow;
