import CurrencyFormat from "react-currency-format";

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
        let fee = amount * bl?.psc_fee_amount;
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

    const TotalBlock = ({ title, data }) => {
        if (title === "FY") {
            title = "FY " + currentFiscalYear;
        }
        return (
            <div
                className="bg-base-lightest font-family-sans font-12px border-1px border-base-light radius-sm margin-left-4 padding-y-2 padding-x-105"
                style={{ minWidth: "206px" }}
            >
                <h3 className="text-base-dark text-normal font-12px">{title + " Total"}</h3>
                <dl className="margin-0 padding-bottom-105">
                    <div className="grid-row padding-y-1">
                        <dt className="margin-0 text-base-dark grid-col-5">Subtotal</dt>
                        <dd className="text-semibold margin-0 grid-col-5">
                            <CurrencyFormat
                                value={data.subtotal}
                                displayType={"text"}
                                thousandSeparator={true}
                                prefix={"$"}
                                decimalScale={2}
                                fixedDecimalScale={true}
                            />
                        </dd>
                    </div>
                    <div className="grid-row padding-y-05">
                        <dt className="margin-0 text-base-dark grid-col-5">Fees</dt>
                        <dd className="text-semibold margin-0 grid-col-5">
                            <CurrencyFormat
                                value={data.fees}
                                displayType={"text"}
                                thousandSeparator={true}
                                decimalScale={2}
                                fixedDecimalScale={true}
                                prefix={"$"}
                            />
                        </dd>
                    </div>
                </dl>
                <CurrencyFormat
                    value={data.total}
                    displayType={"text"}
                    thousandSeparator={true}
                    prefix={"$ "}
                    decimalScale={2}
                    fixedDecimalScale={true}
                    renderText={(value) => <span className="text-semibold font-sans-lg padding-y-105">{value}</span>}
                />
            </div>
        );
    };

    return (
        <summary className="display-flex flex-justify-end margin-y-4">
            <TotalBlock title="Draft" data={totals["Draft"]}></TotalBlock>
            <TotalBlock title="FY" data={totals["FY"]}></TotalBlock>
            <TotalBlock title="Agreement" data={totals["Agreement"]}></TotalBlock>
        </summary>
    );
};
