import PreviewTable from "../../../components/UI/PreviewTable/PreviewTable";

const AgreementBudgetLines = ({ agreement }) => {
    return (
        <div>
            <PreviewTable budgetLinesAdded={agreement?.budget_line_items} readOnly={true} />
        </div>
    );
};

export default AgreementBudgetLines;
