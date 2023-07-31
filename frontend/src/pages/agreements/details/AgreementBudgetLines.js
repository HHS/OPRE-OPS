import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import PreviewTable from "../../../components/UI/PreviewTable/PreviewTable";
import AgreementDetailHeader from "./AgreementDetailHeader";
/**
 * Agreement budget lines.
 * @param {Object} props - The component props.
 * @param {Object} props.agreement - The agreement to display.
 * @returns {React.JSX.Element} - The rendered component.
 */
export const AgreementBudgetLines = ({ agreement }) => {
    return (
        <>
            <AgreementDetailHeader
                agreementId={agreement?.id}
                heading="Budget Lines"
                details="This is a list of all budget lines within this agreement."
            />
            {agreement?.budget_line_items.length > 0 ? (
                <PreviewTable budgetLinesAdded={agreement?.budget_line_items} readOnly={true} />
            ) : (
                <p>No budget lines.</p>
            )}
            <div className="grid-row flex-justify-end margin-top-1">
                <Link
                    className="usa-button float-right margin-top-4 margin-right-0"
                    to={`/agreements/approve/${agreement?.id}`}
                >
                    Plan or Execute Budget Lines
                </Link>
            </div>
        </>
    );
};

AgreementBudgetLines.propTypes = {
    agreement: PropTypes.shape({
        id: PropTypes.number,
        budget_line_items: PropTypes.arrayOf(PropTypes.object),
    }),
};

export default AgreementBudgetLines;
