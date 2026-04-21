import CurrencyFormat from "react-currency-format";
import CurrencyWithSmallCents from "../../../components/UI/CurrencyWithSmallCents/CurrencyWithSmallCents";
import RoundedBox from "../../../components/UI/RoundedBox";

/**
 * Left summary card for the Project Spending tab.
 * Shows the FY total (large), lifetime project total, and FY agreement count.
 *
 * @param {Object} props
 * @param {number} props.fiscalYear
 * @param {number} props.fyTotal - Total spending for the selected FY (non-draft BLIs).
 * @param {number} props.lifetimeTotal - Lifetime project total across all FYs.
 * @param {number} props.fyAgreementCount - Number of agreements active in the selected FY.
 * @returns {React.ReactElement}
 */
const ProjectSpendingTotalsCard = ({ fiscalYear, fyTotal, lifetimeTotal, fyAgreementCount }) => {
    return (
        <RoundedBox
            dataCy="project-spending-totals-card"
            style={{ minHeight: "10rem" }}
        >
            <p className="margin-0 font-12px text-base-dark">FY {fiscalYear} Project Total</p>
            <div className="margin-top-1">
                <CurrencyWithSmallCents
                    amount={fyTotal}
                    dollarsClasses="font-sans-xl"
                    centsStyles={{ fontSize: "10px" }}
                />
            </div>

            <dl className="margin-top-3 margin-bottom-0 font-12px">
                <dt className="text-base-dark margin-0">Lifetime Project Total</dt>
                <dd className="margin-0 margin-top-05 text-bold">
                    <CurrencyFormat
                        value={lifetimeTotal}
                        displayType="text"
                        thousandSeparator={true}
                        prefix="$"
                        decimalScale={2}
                        fixedDecimalScale={true}
                        renderText={(value) => value}
                    />
                </dd>

                <dt className="text-base-dark margin-0 margin-top-2">FY {fiscalYear} Agreements</dt>
                <dd className="margin-0 margin-top-05 font-sans-lg text-bold">{fyAgreementCount}</dd>
            </dl>
        </RoundedBox>
    );
};

export default ProjectSpendingTotalsCard;
