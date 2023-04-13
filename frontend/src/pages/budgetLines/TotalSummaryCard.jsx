export const TotalSummaryCard = ({ budgetLines }) => {
    let currentDate = new Date();
    let month = currentDate.getMonth();
    let year = currentDate.getFullYear();
    const currentFiscalYear = month > 8 ? year + 1 : year;

    const totals = {
        Draft: { subtotal: 0, fees: 0, total: 0 },
        FY: { subtotal: 0, fees: 0, total: 0 },
        Agreement: { subtotal: 0, fees: 0, total: 0 },
    };

    budgetLines.forEach((bl) => {
        let date_needed = new Date(bl?.date_needed);
        let month = date_needed.getMonth();
        let year = date_needed.getFullYear();
        let fiscalYear = month > 8 ? year + 1 : year;
        let amount = bl?.amount;
        let fee = amount * (bl?.psc_fee_amount / 10);
        let total = amount + fee;
        let status = bl?.status.charAt(0).toUpperCase() + bl?.status.slice(1).toLowerCase();

        if (status === "Draft") {
            totals["Draft"]["subtotal"] += amount;
            totals["Draft"]["fees"] += fee;
            totals["Draft"]["total"] += total;
        }

        if (fiscalYear === currentFiscalYear) {
            totals["FY"]["subtotal"] += amount;
            totals["FY"]["fees"] += fee;
            totals["FY"]["total"] += total;
        }

        totals["Agreement"]["subtotal"] += amount;
        totals["Agreement"]["fees"] += fee;
        totals["Agreement"]["total"] += total;
    });

    const TotalBlock = (title, data) => {
        if (title === "FY") {
            title = "FY " + currentFiscalYear;
        }
        return (
            <div className="flex-column flex-4">
                <div>{title + " Total"}</div>
                <div className="grid-container">
                    <div className="grid-row">
                        <div className="grid-col-2">Subtotal</div>
                        <div className="grid-col-2">{data.subtotal}</div>
                    </div>
                    <div className="grid-row">
                        <div className="grid-col-2">Fees</div>
                        <div className="grid-col-2">{data.fees}</div>
                    </div>
                </div>
                <div>{data.total}</div>
            </div>
        );
    };

    return (
        <div className="flex-align-end">
            <TotalBlock title="Draft" data={totals["Draft"]}></TotalBlock>
            <TotalBlock title="FY" data={totals["FY"]}></TotalBlock>
            <TotalBlock title="Agreement" data={totals["Agreement"]}></TotalBlock>
        </div>
    );
};
