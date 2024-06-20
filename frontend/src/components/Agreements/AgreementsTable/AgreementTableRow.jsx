import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PropTypes from "prop-types";
import CurrencyFormat from "react-currency-format";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import ConfirmationModal from "../../UI/Modals/ConfirmationModal";
import TableRowExpandable from "../../UI/TableRowExpandable";
import ChangeIcons from "../../BudgetLineItems/ChangeIcons";
import Tag from "../../UI/Tag";
import TextClip from "../../UI/Text/TextClip";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import { useIsUserAllowedToEditAgreement, useIsAgreementEditable } from "../../../hooks/agreement.hooks";
import {
    useNavigateAgreementReview,
    useNavigateAgreementApprove,
    useHandleEditAgreement,
    useHandleDeleteAgreement
} from "./AgreementsTable.hooks";
import {
    convertCodeForDisplay,
    statusToClassName,
    totalBudgetLineAmountPlusFees,
    totalBudgetLineFeeAmount
} from "../../../helpers/utils";
import {
    getAgreementName,
    getResearchProjectName,
    getAgreementSubTotal,
    getProcurementShopSubTotal,
    getAgreementCreatedDate,
    areAllBudgetLinesInStatus,
    isThereAnyBudgetLines,
    findNextBudgetLine,
    findNextNeedBy,
    getBudgetLineCountsByStatus,
    getAgreementDescription,
    hasBlIsInReview
} from "./AgreementsTable.helpers";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";

/**
 * Renders a row in the agreements table.
 * @component
 * @param {Object} props - The component props.
 * @param {Object} props.agreement - The agreement object to display.
 * @returns {JSX.Element} - The rendered component.
 */
export const AgreementTableRow = ({ agreement }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isRowActive, setIsRowActive] = useState(false);

    const agreementName = getAgreementName(agreement);
    const researchProjectName = getResearchProjectName(agreement);
    const agreementType = convertCodeForDisplay("agreementType", agreement?.agreement_type);
    const agreementSubTotal = getAgreementSubTotal(agreement);
    const procurementShopSubTotal = getProcurementShopSubTotal(agreement);
    const agreementTotal = agreementSubTotal + procurementShopSubTotal;
    const nextBudgetLine = findNextBudgetLine(agreement);
    const nextBudgetLineAmount = nextBudgetLine?.amount
        ? totalBudgetLineAmountPlusFees(
              nextBudgetLine.amount,
              totalBudgetLineFeeAmount(nextBudgetLine.amount, nextBudgetLine.proc_shop_fee_percentage)
          )
        : 0;
    const nextNeedBy = findNextNeedBy(agreement);
    const agreementCreatedByName = useGetUserFullNameFromId(agreement?.created_by);
    const agreementDescription = getAgreementDescription(agreement);
    const agreementCreatedOn = getAgreementCreatedDate(agreement);
    const budgetLineCountsByStatus = getBudgetLineCountsByStatus(agreement);

    // styles for the table row
    const removeBorderBottomIfExpanded = isExpanded ? "border-bottom-none" : "";
    const changeBgColorIfExpanded = { backgroundColor: isExpanded ? "var(--neutral-lightest)" : "" };
    // Validations for editing/deleting an agreement
    const isAgreementEditable = useIsAgreementEditable(agreement?.id);
    const canUserEditAgreement = useIsUserAllowedToEditAgreement(agreement?.id);
    const doesAgreementHaveBLIsInReview = hasBlIsInReview(agreement?.budget_line_items);
    const lockedMessage = doesAgreementHaveBLIsInReview
        ? "This agreement cannot be edited because it is currently In Review for a status change"
        : "";
    const isEditable = isAgreementEditable && canUserEditAgreement && !doesAgreementHaveBLIsInReview;
    const areAllBudgetLinesInDraftStatus = areAllBudgetLinesInStatus(agreement, "DRAFT");
    const areThereAnyBudgetLines = isThereAnyBudgetLines(agreement);
    const canUserDeleteAgreement = canUserEditAgreement && (areAllBudgetLinesInDraftStatus || !areThereAnyBudgetLines);
    // hooks
    const handleSubmitAgreementForApproval = useNavigateAgreementReview();
    const handleGoToApprove = useNavigateAgreementApprove();
    const handleEditAgreement = useHandleEditAgreement();
    const { handleDeleteAgreement, modalProps, setShowModal, showModal } = useHandleDeleteAgreement();

    // TODO figure out logic for when to show goToApproval icon
    const [searchParams] = useSearchParams();
    const forApprovalUrl = searchParams.get("filter") === "for-approval";

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
            goToApproveIcon={forApprovalUrl}
            handleGoToApprove={handleGoToApprove}
        />
    );

    const TableRowData = (
        <>
            <th
                scope="row"
                className={removeBorderBottomIfExpanded}
                style={changeBgColorIfExpanded}
            >
                <Link
                    className="text-ink text-no-underline"
                    to={`/agreements/${agreement.id}`}
                >
                    <TextClip text={agreementName} />
                </Link>
            </th>
            <td
                className={removeBorderBottomIfExpanded}
                style={changeBgColorIfExpanded}
            >
                <TextClip
                    text={researchProjectName}
                    tooltipThreshold={30}
                />
            </td>
            <td
                className={removeBorderBottomIfExpanded}
                style={changeBgColorIfExpanded}
            >
                {agreementType || ""}
            </td>
            <td
                className={removeBorderBottomIfExpanded}
                style={changeBgColorIfExpanded}
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
                className={removeBorderBottomIfExpanded}
                style={changeBgColorIfExpanded}
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
                className={removeBorderBottomIfExpanded}
                style={changeBgColorIfExpanded}
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
            style={{ backgroundColor: "var(--neutral-lightest)" }}
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
            />
        </>
    );
};

AgreementTableRow.propTypes = {
    agreement: PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        project: PropTypes.shape({
            title: PropTypes.string.isRequired
        }),
        agreement_type: PropTypes.string.isRequired,
        budget_line_items: PropTypes.arrayOf(
            PropTypes.shape({
                amount: PropTypes.number.isRequired,
                date_needed: PropTypes.string.isRequired,
                status: PropTypes.string.isRequired
            })
        ).isRequired,
        procurement_shop: PropTypes.shape({
            fee: PropTypes.number.isRequired
        }),
        created_by: PropTypes.number.isRequired,
        notes: PropTypes.string,
        created_on: PropTypes.string,
        project_officer_id: PropTypes.number.isRequired,
        team_members: PropTypes.arrayOf(
            PropTypes.shape({
                id: PropTypes.number.isRequired
            })
        ).isRequired
    }).isRequired
};

export default AgreementTableRow;
