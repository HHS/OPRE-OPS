//

const AgreementDetails =  ({ agreement }) => {

    let {budget_line_items: _, ...agreement_details} = agreement;

    return (
        <div>
            <pre>
            {JSON.stringify(agreement_details, null, 2)}
            </pre>
        </div>
    );
};

export default AgreementDetails;
