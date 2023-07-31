import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import AgreementDetailHeader from "./AgreementDetailHeader";
import AgreementBudgetLinesEdit from "./AgreementBudgetLinesEdit";
import { CreateBudgetLinesProvider } from "../../../components/UI/WizardSteps/StepCreateBudgetLines/context";
import PreviewTable from "../../../components/UI/PreviewTable/PreviewTable";
/**
 * Agreement budget lines.
 * @param {Object} props - The component props.
 * @param {Object} props.agreement - The agreement to display.
 * @returns {React.JSX.Element} - The rendered component.
 */
export const AgreementBudgetLines = ({ agreement }) => {
    const [isEditMode, setIsEditMode] = React.useState(false);

    return (
        <CreateBudgetLinesProvider>
            <AgreementDetailHeader
                heading="Budget Lines"
                details="This is a list of all budget lines within this agreement."
                isEditMode={isEditMode}
                setIsEditMode={setIsEditMode}
            />
            {isEditMode ? (
                <AgreementBudgetLinesEdit agreement={agreement} isEditMode={isEditMode} isReviewMode={false} />
            ) : agreement?.budget_line_items.length > 0 ? (
                <PreviewTable budgetLinesAdded={agreement?.budget_line_items} readOnly={!isEditMode} />
            ) : (
                <p>No budget lines.</p>
            )}

            {!isEditMode && (
                <div className="grid-row flex-justify-end margin-top-1">
                    <Link
                        className="usa-button margin-top-4 margin-right-0"
                        to={`/agreements/approve/${agreement?.id}`}
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
    }),
};

export default AgreementBudgetLines;
