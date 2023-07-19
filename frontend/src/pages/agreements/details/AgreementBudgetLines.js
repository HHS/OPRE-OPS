//

const AgreementBudgetLines = ({ agreement }) => {
    return (
        <div>
            <div style={{ background: "#cccccc", border: "1px dashed #999999" }}>
                <h2>TEMP DEBUG</h2>
                <pre>{JSON.stringify(agreement?.budget_line_items, null, 2)}</pre>
            </div>
        </div>
    );
};

export default AgreementBudgetLines;
