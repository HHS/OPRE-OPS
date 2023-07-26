import PropTypes from "prop-types";
import PreviewTable from "../../../components/UI/PreviewTable/PreviewTable";

/**
 * Agreement budget lines.
 * @param {Object} props - The component props.
 * @param {Object} props.agreement - The agreement to display.
 * @returns {React.JSX.Element} - The rendered component.
 */
export const AgreementBudgetLines = ({ agreement }) => {
    return agreement?.budget_line_items.length > 0 ? (
        <PreviewTable budgetLinesAdded={agreement?.budget_line_items} readOnly={true} />
    ) : (
        <p>No budget lines.</p>
    );
};

AgreementBudgetLines.propTypes = {
    agreement: PropTypes.shape({
        budget_line_items: PropTypes.arrayOf(PropTypes.object),
    }),
};

export default AgreementBudgetLines;
