import { faClock } from "@fortawesome/free-regular-svg-icons";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CurrencyFormat from "react-currency-format";
import { Link, useSearchParams } from "react-router-dom";
import { BLI_STATUS } from "../../../helpers/budgetLines.helpers";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";
import {
    convertCodeForDisplay,
    statusToClassName,
    totalBudgetLineAmountPlusFees,
    totalBudgetLineFeeAmount
} from "../../../helpers/utils";
import ChangeIcons from "../../BudgetLineItems/ChangeIcons";
import ConfirmationModal from "../../UI/Modals/ConfirmationModal";
import TableRowExpandable from "../../UI/TableRowExpandable";
import {
    changeBgColorIfExpanded,
    expandedRowBGColor,
    removeBorderBottomIfExpanded
} from "../../UI/TableRowExpandable/TableRowExpandable.helpers";
import { useTableRow } from "../../UI/TableRowExpandable/TableRowExpandable.hooks";
import Tag from "../../UI/Tag";
import TextClip from "../../UI/Text/TextClip";
import {
    areAllBudgetLinesInStatus,
    findNextBudgetLine,
    findNextNeedBy,
    getAgreementCreatedDate,
    getAgreementDescription,
    getAgreementName,
    getAgreementSubTotal,
    getBudgetLineCountsByStatus,
    getProcurementShopSubTotal,
    getResearchProjectName,
    hasBlIsInReview,
    isAgreementEditable,
    isThereAnyBudgetLines,
    isUserAllowedToEditAgreement
} from "./AgreementsTable.helpers";
import { useHandleDeleteAgreement, useHandleEditAgreement, useNavigateAgreementReview } from "./AgreementsTable.hooks";
import { useGetAgreementByIdQuery, useLazyGetUserByIdQuery } from "../../../api/opsAPI";
import { useSelector } from "react-redux";
import { useState } from "react";
import React from "react";

/**
 * Renders a row in the agreements table.
 * @component
 * @param {Object} props - The component props.
 * @param {number} props.agreementId - The agreement object to display.
 * @returns {JSX.Element} - The rendered component.
 */
export const AgreementTableRow = ({ agreementId }) => {
    const loggedInUserId = useSelector((state) => state?.auth?.activeUser?.id);
    const { isExpanded, isRowActive, setIsExpanded, setIsRowActive } = useTableRow();
    const { data: agreement, isLoading, isSuccess } = useGetAgreementByIdQuery(agreementId);
    const agreementName = isSuccess ? getAgreementName(agreement) : "TBD";
    const researchProjectName = isSuccess ? getResearchProjectName(agreement) : "TBD";
    const agreementType = isSuccess ? convertCodeForDisplay("agreementType", agreement?.agreement_type) : "TBD";
    const agreementSubTotal = isSuccess ? getAgreementSubTotal(agreement) : 0;
    const procurementShopSubTotal = isSuccess ? getProcurementShopSubTotal(agreement) : 0;
    const agreementTotal = agreementSubTotal + procurementShopSubTotal;
    const nextBudgetLine = isSuccess ? findNextBudgetLine(agreement) : null;
    const nextNeedBy = isSuccess ? findNextNeedBy(agreement) : "TBD";
    const budgetLineCountsByStatus = isSuccess ? getBudgetLineCountsByStatus(agreement) : 0;
    const nextBudgetLineAmount = nextBudgetLine?.amount
        ? totalBudgetLineAmountPlusFees(
              nextBudgetLine.amount,
              totalBudgetLineFeeAmount(nextBudgetLine.amount, nextBudgetLine.proc_shop_fee_percentage)
          )
        : 0;

    const [agreementCreatedByName, setAgreementCreatedByName] = useState("TBD");
    const [trigger] = useLazyGetUserByIdQuery();

    React.useEffect(() => {
        trigger(agreement?.created_by)
            .then((response) => {
                if (response?.data) {
                    setAgreementCreatedByName(response.data.full_name || "TBD");
                }
            })
            .catch(() => {
                setAgreementCreatedByName("TBD");
            });
    }, [isExpanded]);

    const agreementDescription = isSuccess ? getAgreementDescription(agreement) : "TBD";
    const agreementCreatedOn = isSuccess ? getAgreementCreatedDate(agreement) : "TBD";

    // styles for the table row
    const borderExpandedStyles = removeBorderBottomIfExpanded(isExpanded);
    const bgExpandedStyles = changeBgColorIfExpanded(isExpanded);
    const doesAgreementHaveBLIsInReview = isSuccess ? hasBlIsInReview(agreement?.budget_line_items) : false;

    const areAllBudgetLinesInDraftStatus = isSuccess ? areAllBudgetLinesInStatus(agreement, BLI_STATUS.DRAFT) : false;
    const areThereAnyBudgetLines = isSuccess ? isThereAnyBudgetLines(agreement) : false;
    const canUserEditAgreement = isSuccess ? isUserAllowedToEditAgreement(agreement, loggedInUserId) : false;

    const canEditAgreement = isSuccess ? isAgreementEditable(agreement) : false;
    const isEditable = canEditAgreement && canUserEditAgreement && !doesAgreementHaveBLIsInReview;

    const canUserDeleteAgreement = canUserEditAgreement && (areAllBudgetLinesInDraftStatus || !areThereAnyBudgetLines);
    // hooks
    const handleSubmitAgreementForApproval = useNavigateAgreementReview();
    const handleEditAgreement = useHandleEditAgreement();
    const { handleDeleteAgreement, modalProps, setShowModal, showModal } = useHandleDeleteAgreement();

    // TODO figure out logic for when to show goToApproval icon
    const [searchParams] = useSearchParams();
    const forApprovalUrl = searchParams.get("filter") === "for-approval";

    function getLockedMessage() {
        const lockedMessages = {
            inReview: "This agreement cannot be edited because it is currently In Review for a status change",
            notTeamMember: "Only team members on this agreement can edit, delete, or send to approval",
            notEditable: "This agreement cannot be edited because of budget lines status",
            default: "Disabled"
        };
        switch (true) {
            case doesAgreementHaveBLIsInReview:
                return lockedMessages.inReview;
            case !canUserEditAgreement:
                return lockedMessages.notTeamMember;
            case !canEditAgreement:
                return lockedMessages.notEditable;
            default:
                return lockedMessages.default;
        }
    }
    const lockedMessage = getLockedMessage();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    const changeIcons = (
        <ChangeIcons
            item={agreement}
            isItemEditable={isEditable}
            lockedMessage={lockedMessage}
            isItemDeletable={canUserDeleteAgreement}
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
            >
                <Link
                    className="text-ink text-no-underline"
                    to={`/agreements/${agreement.id}`}
                >
                    <TextClip
                        text={agreementName}
                        tooltipThreshold={10}
                        maxLines={1}
                    />
                </Link>
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                <TextClip
                    text={researchProjectName}
                    tooltipThreshold={30}
                    maxLines={1}
                />
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                {agreementType || ""}
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
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
            >
                <CurrencyFormat
                    value={nextBudgetLineAmount}
                    displayType={"text"}
                    thousandSeparator={true}
                    prefix={"$"}
                    decimalScale={getDecimalScale(nextBudgetLineAmount)}
                    fixedDecimalScale={true}
                    renderText={(value) => value}
                />
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                {isRowActive && !isExpanded ? <div>{changeIcons}</div> : <div>{nextNeedBy}</div>}
            </td>
        </>
    );

    /**
     * A component that displays the status with its counts
     *
     * @component
     * @param {object} props - The props object containing the following properties:
     * @param {string} props.status - The BLI status.
     * @param {number} props.count - The count of BLI with the status.
     * @returns {JSX.Element} A React component that displays a legend item.
     */
    const StatusCountItem = ({ status, count }) => {
        const label = convertCodeForDisplay("budgetLineStatus", status);
        return (
            <div className="display-flex flex-justify margin-top-1">
                <div className="">
                    <div className="display-flex flex-align-center">
                        <FontAwesomeIcon
                            icon={faCircle}
                            className={`${statusToClassName(status)} height-1 width-1 margin-right-05`}
                        />

                        <span>{label}</span>
                    </div>
                </div>
                <div>
                    <Tag
                        tagStyle="darkTextWhiteBackground"
                        text={`${count}`}
                        label={label}
                        className="margin-left-1"
                    />
                </div>
            </div>
        );
    };

    const ExpandedData = (
        <td
            colSpan={9}
            className="border-top-none"
            style={expandedRowBGColor}
        >
            <div className="display-flex padding-right-9">
                <dl className="font-12px">
                    <dt className="margin-0 text-base-dark">Created By</dt>
                    <dd className="margin-0">{agreementCreatedByName}</dd>
                    <dt className="margin-0 text-base-dark display-flex flex-align-center margin-top-2">
                        <FontAwesomeIcon
                            icon={faClock}
                            className="height-2 width-2 margin-right-1"
                        />
                        {agreementCreatedOn}
                    </dt>
                </dl>
                <dl
                    className="font-12px width-mobile"
                    style={{ marginLeft: "2.5rem" }}
                >
                    <dt className="margin-0 text-base-dark">Description</dt>
                    <dd
                        className="margin-0"
                        style={{ maxWidth: "400px" }}
                    >
                        {agreementDescription ? agreementDescription : "No description created."}
                    </dd>
                </dl>
                <dl
                    className="font-12px"
                    style={{ marginLeft: "3.125rem" }}
                >
                    <dt className="margin-0 text-base-dark">Budget Lines</dt>
                    <dd
                        className="margin-0"
                        style={{ maxWidth: "400px" }}
                    >
                        <div className="font-12px margin-top-1">
                            {Object.entries(budgetLineCountsByStatus).map(([status, count]) => (
                                <StatusCountItem
                                    key={status}
                                    status={status}
                                    count={count}
                                />
                            ))}
                        </div>
                    </dd>
                </dl>
                <div className="flex-align-self-end margin-left-auto margin-bottom-1">{changeIcons}</div>
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
                data-testid={`agreement-table-row-${agreement.id}`}
            />
        </>
    );
};

export default AgreementTableRow;
