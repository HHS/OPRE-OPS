import { Link, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { NO_DATA } from "../../../constants";
import { getAgreementType, isNotDevelopedYet } from "../../../helpers/agreement.helpers";
import { BLI_STATUS } from "../../../helpers/budgetLines.helpers";
import { formatCurrency } from "../../../helpers/currencyFormat.helpers";
import ChangeIcons from "../../BudgetLineItems/ChangeIcons";
import ConfirmationModal from "../../UI/Modals/ConfirmationModal";
import TableRowExpandable from "../../UI/TableRowExpandable";
import { expandedRowBGColor } from "../../UI/TableRowExpandable/TableRowExpandable.helpers";
import { useTableRow } from "../../UI/TableRowExpandable/TableRowExpandable.hooks";
import TextClip from "../../UI/Text/TextClip";
import {
    areAllBudgetLinesInStatus,
    getAgreementContractNumber,
    getAgreementEndDate,
    getAgreementName,
    getAgreementStartDate,
    getProcurementShopDisplay,
    getResearchProjectName,
    isThereAnyBudgetLines
} from "./AgreementsTable.helpers";
import { TABLE_HEADINGS_LIST } from "./AgreementsTable.constants";
import { AWARD_TYPE_LABELS } from "../../../pages/agreements/agreements.constants";
import { useHandleDeleteAgreement, useHandleEditAgreement, useNavigateAgreementReview } from "./AgreementsTable.hooks";
import { useIsUserReadOnly } from "../../../hooks/user.hooks";

/**
 * Renders a row in the agreements table.
 * @component
 * @param {Object} props - The component props.
 * @param {import("../../../types/AgreementTypes").Agreement} props.agreement - The agreement object to display.
 * @returns {JSX.Element} - The rendered component.
 */
export const AgreementTableRow = ({ agreement }) => {
    const { isExpanded, isRowActive, setIsExpanded, setIsRowActive } = useTableRow();
    const isSuccess = !!agreement;
    const agreementName = isSuccess ? getAgreementName(agreement) : NO_DATA;
    const agreementType = isSuccess ? getAgreementType(agreement?.agreement_type) : NO_DATA;
    const agreementTotal = agreement?.agreement_total ?? 0;
    const agreementStartDate = isSuccess ? getAgreementStartDate(agreement) : NO_DATA;
    const agreementEndDate = isSuccess ? getAgreementEndDate(agreement) : NO_DATA;

    const fyObligatedAmount = isSuccess ? Number(agreement?.fy_obligated ?? 0) : 0;

    const researchProjectName = isSuccess ? getResearchProjectName(agreement) : NO_DATA;
    const procurementShopDisplay = isSuccess ? getProcurementShopDisplay(agreement) : NO_DATA;
    const agreementSubTotal = isSuccess ? (agreement?.agreement_subtotal ?? 0) : 0;
    const agreementFees = isSuccess ? (agreement?.total_agreement_fees ?? 0) : 0;
    const lifetimeObligated = isSuccess ? (agreement?.lifetime_obligated ?? 0) : 0;
    const contractNumber = isSuccess ? getAgreementContractNumber(agreement) : NO_DATA;
    const awardType = AWARD_TYPE_LABELS[agreement?.award_type] ?? NO_DATA;
    const vendor = isSuccess ? (agreement?.vendor ?? NO_DATA) : NO_DATA;

    const areAllBudgetLinesInDraftStatus = isSuccess ? areAllBudgetLinesInStatus(agreement, BLI_STATUS.DRAFT) : false;
    const isSuperUser = useSelector((state) => state.auth?.activeUser?.is_superuser) ?? false;
    const isReadOnly = useIsUserReadOnly();

    const canUserEditAgreement = isSuccess && agreement?._meta.isEditable;
    const areThereAnyBudgetLines = isSuccess ? isThereAnyBudgetLines(agreement) : false;
    const isAgreementTypeNotDeveloped = isSuccess ? isNotDevelopedYet(agreement?.agreement_type ?? "") : false;
    const isEditable = canUserEditAgreement && (!isAgreementTypeNotDeveloped || isSuperUser);
    const canUserDeleteAgreement =
        isSuperUser || (canUserEditAgreement && (areAllBudgetLinesInDraftStatus || !areThereAnyBudgetLines));
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

    const changeIcons = !isReadOnly ? (
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
    ) : null;

    const TableRowData = (
        <>
            <td data-cy="agreement-name">
                <Link
                    className="text-ink text-no-underline"
                    to={`/agreements/${agreement?.id}`}
                    aria-label={`View agreement details for ${agreementName || "agreement"}`}
                >
                    <TextClip
                        text={agreementName}
                        maxLines={2}
                    />
                </Link>
            </td>
            <td data-cy="agreement-type">{agreementType || ""}</td>
            <td data-cy="agreement-start-date">{agreementStartDate}</td>
            <td data-cy="agreement-end-date">{agreementEndDate}</td>
            <td data-cy="agreement-total">{formatCurrency(agreementTotal)}</td>
            <td data-cy="fy-obligated-amount">
                {isRowActive && !isExpanded ? <div>{changeIcons}</div> : formatCurrency(fyObligatedAmount)}
            </td>
        </>
    );

    const ExpandedData = (
        <td
            colSpan={TABLE_HEADINGS_LIST.length + 1}
            className="border-top-none"
            style={expandedRowBGColor}
        >
            <div
                className="display-flex padding-right-4"
                style={{ justifyContent: "space-between" }}
            >
                <dl className="font-12px">
                    <dt className="margin-0 text-base-dark">Project</dt>
                    <dd className="margin-0">{researchProjectName || NO_DATA}</dd>
                </dl>
                {/* REVIEW: NEW — gates Procurement Shop / Subtotal / Fees / Lifetime Obligated for GRANT rows.
                    Grants have no procurement shop and no BLIs at creation time, so these cells would all
                    show TBD or $0 and are misleading. Using a string literal "GRANT" rather than importing
                    the AGREEMENT_TYPES constant because this file already uses the string form elsewhere
                    (e.g. isNotDevelopedYet) and adding another import for a one-liner guard would be noisy.
                    QUESTION FOR REVIEW: should we import AGREEMENT_TYPES.GRANT here for consistency? */}
                {agreement?.agreement_type !== "GRANT" && (
                    <>
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
                            <dd className="margin-0">{formatCurrency(agreementSubTotal)}</dd>
                        </dl>
                        <dl
                            className="font-12px"
                            style={{ marginLeft: "2.5rem" }}
                        >
                            <dt className="margin-0 text-base-dark">Fees</dt>
                            <dd className="margin-0">{formatCurrency(agreementFees)}</dd>
                        </dl>
                        <dl
                            className="font-12px"
                            style={{ marginLeft: "2.5rem" }}
                        >
                            <dt className="margin-0 text-base-dark">Lifetime Obligated</dt>
                            <dd className="margin-0">{formatCurrency(lifetimeObligated)}</dd>
                        </dl>
                    </>
                )}
            </div>
            <div
                className="display-flex padding-right-4"
                style={{ justifyContent: "space-between" }}
            >
                {/* REVIEW: NEW — gates Contract # / Award Type / spacer / Vendor for GRANT rows.
                    Change-icons div intentionally kept outside this gate so delete/edit icons
                    still render for grants. The spacer dl (&nbsp;) is a layout placeholder that
                    existed before this change; it's included in the gate since it only makes sense
                    when Contract # and Vendor are present. */}
                {agreement?.agreement_type !== "GRANT" && (
                    <>
                        <dl className="font-12px">
                            <dt className="margin-0 text-base-dark">Contract #</dt>
                            <dd className="margin-0">{contractNumber || NO_DATA}</dd>
                        </dl>
                        <dl
                            className="font-12px"
                            style={{ marginLeft: "7rem" }}
                        >
                            <dt className="margin-0 text-base-dark">Award Type</dt>
                            <dd className="margin-0">{awardType}</dd>
                        </dl>
                        <dl
                            className="font-12px"
                            style={{ marginLeft: "2.5rem" }}
                        >
                            <dt className="margin-0 text-base-dark">&nbsp;</dt>
                            <dd className="margin-0">&nbsp;</dd>
                        </dl>
                        <dl
                            className="font-12px"
                            style={{ marginLeft: "4rem" }}
                        >
                            <dt className="margin-0 text-base-dark">Vendor</dt>
                            <dd className="margin-0">{vendor}</dd>
                        </dl>
                    </>
                )}
                {!isReadOnly && (
                    <div
                        className="flex-align-self-end margin-bottom-1"
                        data-cy="change-icons-expanded"
                    >
                        {changeIcons}
                    </div>
                )}
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
