import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import AgreementDetailHeader from "./AgreementDetailHeader";
import { CreateBudgetLinesProvider } from "../../../components/UI/WizardSteps/StepCreateBudgetLines/context";
import BudgetLinesTable from "../../../components/BudgetLineItems/BudgetLinesTable";
import StepCreateBudgetLines from "../../../components/UI/WizardSteps/StepCreateBudgetLines/StepCreateBudgetLines";
import { useIsUserAllowedToEditAgreement } from "../../../helpers/agreement-hooks";
import useAlert from "../../../helpers/use-alert";
import AgreementTotalBudgetLinesCard from "../../../components/Agreements/AgreementDetailsCards/AgreementTotalBudgetLinesCard";
import AgreementValuesCard from "../../../components/Agreements/AgreementDetailsCards/AgreementValuesCard";
import { useState } from "react";
import AgreementBudgetLinesHeader from "./AgreementBudgetLinesHeader";
import { draftBudgetLineStatuses } from "../../../helpers/utils";

/**
 * Renders Agreement budget lines view
 * @param {Object} props - The component props.
 * @param {Object} props.agreement - The agreement to display.
 * @param {boolean} props.isEditMode - Whether the edit mode is on.
 * @param {function} props.setIsEditMode - The function to set the edit mode.
 * @returns {React.JSX.Element} - The rendered component.
 */
export const AgreementBudgetLines = ({ agreement, isEditMode, setIsEditMode }) => {
    const navigate = useNavigate();
    const [includeDrafts, setIncludeDrafts] = useState(false);
    const canUserEditAgreement = useIsUserAllowedToEditAgreement(agreement?.id);
    const { setAlert } = useAlert();

    // eslint-disable-next-line no-unused-vars
    let { budget_line_items: _, ...agreement_details } = agreement;
    // details for AgreementTotalBudgetLinesCard
    const blis = agreement.budget_line_items ? agreement.budget_line_items : [];
    const filteredBlis = includeDrafts ? blis : blis.filter((bli) => !draftBudgetLineStatuses.includes(bli.status));
    const numberOfAgreements = filteredBlis.length;
    const countsByStatus = filteredBlis.reduce((p, c) => {
        const status = c.status;
        if (!(status in p)) {
            p[status] = 0;
        }
        p[status]++;
        return p;
    }, {});

    // if there are no BLIS than the user can edit
    if (agreement?.budget_line_items?.length === 0) {
        setIsEditMode(true);
    }

    return (
        <CreateBudgetLinesProvider>
            <AgreementBudgetLinesHeader
                heading="Budget Lines Summary"
                details="The summary below shows a breakdown of all budget lines within this agreement."
                includeDrafts={includeDrafts}
                setIncludeDrafts={setIncludeDrafts}
            />
            <div className="display-flex flex-justify">
                <AgreementTotalBudgetLinesCard
                    numberOfAgreements={numberOfAgreements}
                    countsByStatus={countsByStatus}
                    includeDrafts={includeDrafts}
                />
                <AgreementValuesCard budgetLineItems={filteredBlis} />
            </div>
            <AgreementDetailHeader
                heading="Budget Lines"
                details="This is a list of all budget lines within this agreement."
                isEditMode={isEditMode}
                setIsEditMode={setIsEditMode}
                isEditable={canUserEditAgreement}
            />
            {isEditMode ? (
                <StepCreateBudgetLines
                    selectedAgreement={agreement}
                    existingBudgetLines={agreement?.budget_line_items}
                    isEditMode={isEditMode}
                    setIsEditMode={setIsEditMode}
                    isReviewMode={false}
                    selectedProcurementShop={agreement?.procurement_shop}
                    selectedResearchProject={agreement?.research_project}
                    canUserEditBudgetLines={canUserEditAgreement}
                    wizardSteps={[]}
                    continueBtnText="Save Changes"
                    currentStep={0}
                    workflow="none"
                    goBack={() => {
                        setIsEditMode(false);
                        navigate(`/agreements/${agreement.id}/budget-lines`);
                    }}
                    continueOverRide={() => {
                        setAlert({
                            type: "success",
                            heading: "Budget Lines Saved",
                            message: "The budget lines have been successfully saved.",
                            navigateUrl: navigate(-1)
                        });
                    }}
                />
            ) : agreement?.budget_line_items.length > 0 ? (
                <BudgetLinesTable
                    budgetLinesAdded={agreement?.budget_line_items}
                    readOnly={!isEditMode}
                />
            ) : (
                <p>No budget lines.</p>
            )}

            {!isEditMode && (
                <div className="grid-row flex-justify-end margin-top-1">
                    <Link
                        className="usa-button margin-top-4 margin-right-0"
                        to={`/agreements/approve/${agreement?.id}`}
                        data-cy="bli-tab-continue-btn"
                    >
                        Plan or Execute Budget Lines
                    </Link>
                </div>
            )}
        </CreateBudgetLinesProvider>
    );
};

AgreementBudgetLines.propTypes = {
    agreement: PropTypes.shape({
        id: PropTypes.number,
        budget_line_items: PropTypes.arrayOf(PropTypes.object),
        procurement_shop: PropTypes.object,
        research_project: PropTypes.object,
        team_members: PropTypes.arrayOf(PropTypes.object),
        created_by: PropTypes.number,
        project_officer: PropTypes.number
    }),
    isEditMode: PropTypes.bool,
    setIsEditMode: PropTypes.func
};

export default AgreementBudgetLines;
