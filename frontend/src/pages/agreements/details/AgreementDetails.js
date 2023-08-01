import React from "react";
import PropTypes from "prop-types";
import AgreementTotalBudgetLinesCard from "../../../components/Agreements/AgreementDetailsCards/AgreementTotalBudgetLinesCard";
import AgreementValuesCard from "../../../components/Agreements/AgreementDetailsCards/AgreementValuesCard";
import AgreementDetailHeader from "./AgreementDetailHeader";
import AgreementDetailsView from "./AgreementDetailsView";
import AgreementDetailsEdit from "./AgreementDetailsEdit";

/**
 * Renders the details of an agreement, including budget lines, spending, and other information.
 * @param {object} props - The component props.
 * @param {object} props.agreement - The agreement object to display details for.
 * @param {object} props.projectOfficer - The project officer object for the agreement.
 * @param {boolean} props.isEditMode - Whether the edit mode is on.
 * @param {function} props.setIsEditMode - The function to set the edit mode.
 * @returns {React.JSX.Element} - The rendered component.
 */
const AgreementDetails = ({ agreement, projectOfficer, isEditMode, setIsEditMode }) => {
    // eslint-disable-next-line no-unused-vars
    let { budget_line_items: _, ...agreement_details } = agreement;
    // details for AgreementTotalBudgetLinesCard
    const blis = agreement.budget_line_items ? agreement.budget_line_items : [];
    const numberOfAgreements = blis.length;
    const countsByStatus = blis.reduce((p, c) => {
        const status = c.status;
        if (!(status in p)) {
            p[status] = 0;
        }
        p[status]++;
        return p;
    }, {});

    return (
        <div>
            <AgreementDetailHeader
                heading="Agreement Summary"
                details="The summary below shows the budget lines and spending for this agreement."
                isEditMode={isEditMode}
                setIsEditMode={setIsEditMode}
            />
            <div className="display-flex flex-justify">
                <AgreementTotalBudgetLinesCard
                    numberOfAgreements={numberOfAgreements}
                    countsByStatus={countsByStatus}
                />
                <AgreementValuesCard budgetLineItems={blis} />
            </div>
            <h2 className="font-sans-lg margin-top-3">Agreement Details</h2>
            {isEditMode ? (
                <AgreementDetailsEdit agreement={agreement} projectOfficer={projectOfficer} isEditMode={isEditMode}
                        setIsEditMode={setIsEditMode}/>
            ) : (
                <AgreementDetailsView agreement={agreement} projectOfficer={projectOfficer} />
            )}
        </div>
    );
};

AgreementDetails.propTypes = {
    agreement: PropTypes.object.isRequired,
    projectOfficer: PropTypes.object.isRequired,
    isEditMode: PropTypes.bool,
    setIsEditMode: PropTypes.func
};

export default AgreementDetails;
