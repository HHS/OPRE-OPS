import { useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import CurrencyFormat from "react-currency-format";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import { convertCodeForDisplay } from "../../../helpers/utils";
import TableTag from "../../UI/TableTag";
import ConfirmationModal from "../../UI/Modals/ConfirmationModal";
import TableRowExpandable from "../../UI/TableRowExpandable";
import ChangeIcons from "../../BudgetLineItems/ChangeIcons";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import { useIsUserAllowedToEditAgreement, useIsAgreementEditable } from "../../../hooks/agreement.hooks";
import { useAgreementApproval, useHandleEditAgreement, useHandleDeleteAgreement } from "./agreements-table.hooks";
import {
    getAgreementName,
    getResearchProjectName,
    getAgreementSubTotal,
    getProcurementShopSubTotal,
    findMinDateNeeded,
    getAgreementNotes,
    getAgreementCreatedDate,
    getAgreementStatus,
    areAllBudgetLinesInStatus,
    isThereAnyBudgetLines
} from "./AgreementsTable.helpers";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";
import TableCellText from "../../UI/Table/TableCellText";

/**
 * Renders a row in the agreements table.
 *
 * @param {Object} props - The component props.
 * @param {Object} props.agreement - The agreement object to display.
 * @returns {React.JSX.Element} - The rendered component.
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
    const nextNeedBy = findMinDateNeeded(agreement);
    const agreementCreatedByName = useGetUserFullNameFromId(agreement?.created_by);
    const agreementNotes = getAgreementNotes(agreement);
    const agreementCreatedOn = getAgreementCreatedDate(agreement);
    const agreementStatus = getAgreementStatus(agreement);

    // styles for the table row
    const removeBorderBottomIfExpanded = isExpanded ? "border-bottom-none" : "";
    const changeBgColorIfExpanded = { backgroundColor: isExpanded ? "var(--neutral-lightest)" : "" };
    // Validations for editing/deleting an agreement
    const isAgreementEditable = useIsAgreementEditable(agreement?.id);
    const canUserEditAgreement = useIsUserAllowedToEditAgreement(agreement?.id);
    const isEditable = isAgreementEditable && canUserEditAgreement;
    const areAllBudgetLinesInDraftStatus = areAllBudgetLinesInStatus(agreement, "DRAFT");
    const areThereAnyBudgetLines = isThereAnyBudgetLines(agreement);
    const canUserDeleteAgreement = canUserEditAgreement && (areAllBudgetLinesInDraftStatus || !areThereAnyBudgetLines);
    // hooks
    const handleSubmitAgreementForApproval = useAgreementApproval();
    const handleEditAgreement = useHandleEditAgreement();
    const { handleDeleteAgreement, modalProps, setShowModal, showModal } = useHandleDeleteAgreement();

    const changeIcons = (
        <ChangeIcons
            item={agreement}
            isItemEditable={isEditable}
            isItemDeletable={canUserDeleteAgreement}
            handleDeleteItem={handleDeleteAgreement}
            handleSetItemForEditing={handleEditAgreement}
            duplicateIcon={false}
            sendToReviewIcon={true}
            handleSubmitItemForApproval={handleSubmitAgreementForApproval}
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
                    to={"/agreements/" + agreement.id}
                >
                    <TableCellText text={agreementName} />
                </Link>
            </th>
            <td
                className={removeBorderBottomIfExpanded}
                style={changeBgColorIfExpanded}
            >
                <TableCellText text={researchProjectName} />
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
                {nextNeedBy}
            </td>
            <td
                className={removeBorderBottomIfExpanded}
                style={changeBgColorIfExpanded}
            >
                {isRowActive && !isExpanded ? <div>{changeIcons}</div> : <TableTag status={agreementStatus} />}
            </td>
        </>
    );

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
                    className="font-12px"
                    style={{ marginLeft: "9.0625rem" }}
                >
                    <dt className="margin-0 text-base-dark">Notes</dt>
                    <dd
                        className="margin-0"
                        style={{ maxWidth: "400px" }}
                    >
                        {agreementNotes ? agreementNotes : "No notes added."}
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
                isRowActive={isRowActive}
                setIsRowActive={setIsRowActive}
            />
        </>
    );
};

AgreementTableRow.propTypes = {
    agreement: PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        research_project: PropTypes.shape({
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
