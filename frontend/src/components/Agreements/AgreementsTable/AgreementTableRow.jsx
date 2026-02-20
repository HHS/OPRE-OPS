import CurrencyFormat from "react-currency-format";
import { Link, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetAgreementByIdQuery } from "../../../api/opsAPI";
import { NO_DATA } from "../../../constants";
import { getAgreementType, isNotDevelopedYet } from "../../../helpers/agreement.helpers";
import { BLI_STATUS } from "../../../helpers/budgetLines.helpers";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";
import { getCurrentFiscalYear } from "../../../helpers/utils";
import ChangeIcons from "../../BudgetLineItems/ChangeIcons";
import ConfirmationModal from "../../UI/Modals/ConfirmationModal";
import TableRowExpandable from "../../UI/TableRowExpandable";
import {
    changeBgColorIfExpanded,
    expandedRowBGColor,
    removeBorderBottomIfExpanded
} from "../../UI/TableRowExpandable/TableRowExpandable.helpers";
import { useTableRow } from "../../UI/TableRowExpandable/TableRowExpandable.hooks";
import TextClip from "../../UI/Text/TextClip";
import {
    areAllBudgetLinesInStatus,
    getAgreementContractNumber,
    getAgreementEndDate,
    getAgreementName,
    getAgreementStartDate,
    getFYObligatedAmount,
    getProcurementShopDisplay,
    getResearchProjectName,
    isThereAnyBudgetLines
} from "./AgreementsTable.helpers";
import { TABLE_HEADINGS_LIST } from "./AgreementsTable.constants";
import { useHandleDeleteAgreement, useHandleEditAgreement, useNavigateAgreementReview } from "./AgreementsTable.hooks";

/**
 * Renders a row in the agreements table.
 * @component
 * @param {Object} props - The component props.
 * @param {number} props.agreementId - The agreement object to display.
 * @param {string} props.selectedFiscalYear - The selected fiscal year.
 * @returns {JSX.Element} - The rendered component.
 */
export const AgreementTableRow = ({ agreementId, selectedFiscalYear }) => {
    const { isExpanded, isRowActive, setIsExpanded, setIsRowActive } = useTableRow();
    /** @type {{data?: import("../../../types/AgreementTypes").Agreement | undefined, isLoading: boolean, isSuccess: boolean}} */
    const { data: agreement, isLoading, isSuccess } = useGetAgreementByIdQuery(agreementId, { skip: !agreementId });
    const agreementName = isSuccess ? getAgreementName(agreement) : NO_DATA;
    const agreementType = isSuccess ? getAgreementType(agreement?.agreement_type) : NO_DATA;
    const agreementTotal = agreement?.agreement_total ?? 0;
    const agreementStartDate = isSuccess ? getAgreementStartDate(agreement) : NO_DATA;
    const agreementEndDate = isSuccess ? getAgreementEndDate(agreement) : NO_DATA;

    const effectiveFiscalYear =
        selectedFiscalYear === "All" ? Number(getCurrentFiscalYear()) : Number(selectedFiscalYear);
    const fyObligatedAmount = isSuccess ? getFYObligatedAmount(agreement, effectiveFiscalYear) : 0;

    // Expanded row values
    const researchProjectName = isSuccess ? getResearchProjectName(agreement) : NO_DATA;
    const procurementShopDisplay = isSuccess ? getProcurementShopDisplay(agreement) : NO_DATA;
    const agreementSubTotal = isSuccess ? (agreement?.agreement_subtotal ?? 0) : 0;
    const agreementFees = isSuccess ? (agreement?.total_agreement_fees ?? 0) : 0;
    const lifetimeObligated = isSuccess ? (agreement?.lifetime_obligated ?? 0) : 0;
    const contractNumber = isSuccess ? getAgreementContractNumber(agreement) : NO_DATA;

    // styles for the table row
    const borderExpandedStyles = removeBorderBottomIfExpanded(isExpanded);
    const bgExpandedStyles = changeBgColorIfExpanded(isExpanded);
    // auth checks
    const areAllBudgetLinesInDraftStatus = isSuccess ? areAllBudgetLinesInStatus(agreement, BLI_STATUS.DRAFT) : false;
    const isSuperUser = useSelector((state) => state.auth?.activeUser?.is_superuser) ?? false;

    const canUserEditAgreement = isSuccess && agreement?._meta.isEditable;
    const areThereAnyBudgetLines = isSuccess ? isThereAnyBudgetLines(agreement) : false;
    const isAgreementTypeNotDeveloped = isSuccess ? isNotDevelopedYet(agreement?.agreement_type ?? "") : false;
    const isEditable = isSuperUser || (canUserEditAgreement && !isAgreementTypeNotDeveloped);
    const canUserDeleteAgreement =
        isSuperUser || (canUserEditAgreement && (areAllBudgetLinesInDraftStatus || !areThereAnyBudgetLines));
    // hooks
    const handleSubmitAgreementForApproval = useNavigateAgreementReview();
    const handleEditAgreement = useHandleEditAgreement();
    const { handleDeleteAgreement, modalProps, setShowModal, showModal } = useHandleDeleteAgreement();

    const [searchParams] = useSearchParams();
    const forApprovalUrl = searchParams.get("filter") === "for-approval";

    function getLockedMessage() {
        const lockedMessages = {
            notTeamMember: "Only team members on this agreement can edit, delete, or send to approval",
            notDeveloped:
                "This agreement cannot be edited because it is not developed yet, \nplease contact the Budget Team.",
            default: "Disabled"
        };
        switch (true) {
            case isSuperUser:
                return "";
            case !canUserEditAgreement:
                return lockedMessages.notTeamMember;
            case isAgreementTypeNotDeveloped:
                return lockedMessages.notDeveloped;
            default:
                return lockedMessages.default;
        }
    }
    const lockedMessage = getLockedMessage();

    if (isLoading) {
        return (
            <tr>
                <td
                    colSpan={TABLE_HEADINGS_LIST.length + 1}
                    className="text-center"
                >
                    Loading...
                </td>
            </tr>
        );
    }

    const changeIcons = (
        <ChangeIcons
            item={agreement ?? {}}
            isItemEditable={isEditable ?? false}
            lockedMessage={lockedMessage}
            isItemDeletable={canUserDeleteAgreement ?? false}
            handleDeleteItem={handleDeleteAgreement}
            handleSetItemForEditing={handleEditAgreement}
            duplicateIcon={false}
            sendToReviewIcon={!forApprovalUrl}
            handleSubmitItemForApproval={handleSubmitAgreementForApproval}
        />
    );

    const TableRowData = (
        <>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
                data-cy="agreement-name"
            >
                <Link
                    className="text-ink text-no-underline"
                    to={`/agreements/${agreement?.id}`}
                    aria-label={`View agreement details for ${agreementName || "agreement"}`}
                >
                    <TextClip
                        text={agreementName}
                        tooltipThreshold={10}
                        maxLines={2}
                    />
                </Link>
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
                data-cy="agreement-type"
            >
                {agreementType || ""}
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
                data-cy="agreement-start-date"
            >
                {agreementStartDate}
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
                data-cy="agreement-end-date"
            >
                {agreementEndDate}
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
                data-cy="agreement-total"
            >
                <CurrencyFormat
                    value={agreementTotal}
                    displayType={"text"}
                    thousandSeparator={true}
                    prefix={"$"}
                    decimalScale={getDecimalScale(agreementTotal)}
                    fixedDecimalScale={true}
                    renderText={(value) => value}
                />
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
                data-cy="fy-obligated-amount"
            >
                {isRowActive && !isExpanded ? (
                    <div>{changeIcons}</div>
                ) : (
                    <CurrencyFormat
                        value={fyObligatedAmount}
                        displayType={"text"}
                        thousandSeparator={true}
                        prefix={"$"}
                        decimalScale={getDecimalScale(fyObligatedAmount)}
                        fixedDecimalScale={true}
                        renderText={(value) => value}
                    />
                )}
            </td>
        </>
    );

    const ExpandedData = (
        <td
            colSpan={TABLE_HEADINGS_LIST.length + 1}
            className="border-top-none"
            style={expandedRowBGColor}
        >
            <div className="display-flex padding-right-9">
                <dl className="font-12px">
                    <dt className="margin-0 text-base-dark">Project</dt>
                    <dd className="margin-0">{researchProjectName || NO_DATA}</dd>
                </dl>
                <dl
                    className="font-12px"
                    style={{ marginLeft: "2.5rem" }}
                >
                    <dt className="margin-0 text-base-dark">Procurement Shop</dt>
                    <dd className="margin-0">{procurementShopDisplay}</dd>
                </dl>
                <dl
                    className="font-12px"
                    style={{ marginLeft: "2.5rem" }}
                >
                    <dt className="margin-0 text-base-dark">Subtotal</dt>
                    <dd className="margin-0">
                        <CurrencyFormat
                            value={agreementSubTotal}
                            displayType={"text"}
                            thousandSeparator={true}
                            prefix={"$"}
                            decimalScale={getDecimalScale(agreementSubTotal)}
                            fixedDecimalScale={true}
                            renderText={(value) => value}
                        />
                    </dd>
                </dl>
                <dl
                    className="font-12px"
                    style={{ marginLeft: "2.5rem" }}
                >
                    <dt className="margin-0 text-base-dark">Fees</dt>
                    <dd className="margin-0">
                        <CurrencyFormat
                            value={agreementFees}
                            displayType={"text"}
                            thousandSeparator={true}
                            prefix={"$"}
                            decimalScale={getDecimalScale(agreementFees)}
                            fixedDecimalScale={true}
                            renderText={(value) => value}
                        />
                    </dd>
                </dl>
                <dl
                    className="font-12px"
                    style={{ marginLeft: "2.5rem" }}
                >
                    <dt className="margin-0 text-base-dark">Lifetime Obligated</dt>
                    <dd className="margin-0">
                        <CurrencyFormat
                            value={lifetimeObligated}
                            displayType={"text"}
                            thousandSeparator={true}
                            prefix={"$"}
                            decimalScale={getDecimalScale(lifetimeObligated)}
                            fixedDecimalScale={true}
                            renderText={(value) => value}
                        />
                    </dd>
                </dl>
                <div className="flex-align-self-end margin-left-auto margin-bottom-1">{changeIcons}</div>
            </div>
            <div className="display-flex">
                <dl className="font-12px">
                    <dt className="margin-0 text-base-dark">Contract #</dt>
                    <dd className="margin-0">{contractNumber || NO_DATA}</dd>
                </dl>
            </div>
        </td>
    );

    return (
        <>
            {showModal && (
                <ConfirmationModal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    handleConfirm={modalProps.handleConfirm}
                />
            )}
            <TableRowExpandable
                tableRowData={TableRowData}
                expandedData={ExpandedData}
                isExpanded={isExpanded}
                setIsExpanded={setIsExpanded}
                setIsRowActive={setIsRowActive}
                data-testid={`agreement-table-row-${agreement?.id}`}
            />
        </>
    );
};

export default AgreementTableRow;
