// 

const AgreementBudgetLines =  ({ agreement }) => {

    return (
        <div>
            <div>
            <pre>
            {JSON.stringify(agreement?.budget_line_items, null, 2)}
            </pre>
        </div>
        </div>
    );
};

export default AgreementBudgetLines;
