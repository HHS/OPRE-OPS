import CurrencyFormat from "react-currency-format";
import { useGetCanFundingSummaryQuery } from "../../../api/opsAPI";
import { calculatePercent, formatDateNeeded } from "../../../helpers/utils";
import LineGraph from "../../UI/DataViz/LineGraph";
import ReverseLineGraph from "../../UI/DataViz/LineGraph/ReverseLineGraph";
import Tag from "../../UI/Tag";
import style from "./styles.module.css";
import { Link } from "react-router-dom";

/**
 * @component CanCard
 * @description Displays the CAN card
 * @param {Object} props - The props
 * @param {number} props.canId - The CAN id
 * @param {number} props.fiscalYear - The fiscal year
 * @returns {JSX.Element} - The CAN card
 */
const CanCard = ({ canId, fiscalYear }) => {
    const { data: canFundingData, isLoading } = useGetCanFundingSummaryQuery({
        ids: [canId],
        fiscalYear: fiscalYear,
        refetchOnMountOrArgChange: true
    });

    const can = canFundingData?.cans[0].can;
    const appropriationYear = canFundingData?.cans[0].can.appropriation_date;
    const expirationDate = new Date(canFundingData?.cans[0].expiration_date);
    const obligateBy = new Date(expirationDate);
    obligateBy.setDate(obligateBy.getDate());

    const receivedPercent = calculatePercent(canFundingData?.received_funding, canFundingData?.total_funding);
    const receivedExpectedData = [
        {
            id: 1,
            value: canFundingData?.received_funding,
            percent: receivedPercent,
            color: "var(--data-viz-budget-graph-1)"
        },
        {
            id: 2,
            value: canFundingData?.total_funding,
            percent: 100 - receivedPercent,
            color: "var(--data-viz-budget-graph-2)"
        }
    ];

    const spendingAmount =
        canFundingData?.planned_funding + canFundingData?.in_execution_funding + canFundingData?.obligated_funding;

    const spendingPercent = calculatePercent(spendingAmount, canFundingData?.total_funding);
    const spendingAvailableData = [
        {
            id: 1,
            value: spendingAmount,
            percent: spendingPercent,
            color: "var(--data-viz-budget-graph-2)"
        },
        {
            id: 2,
            value: canFundingData?.total_funding,
            percent: 100 - spendingPercent,
            color: "var(--data-viz-budget-graph-1)"
        }
    ];

    if (isLoading) {
        return <p>Loading...</p>;
    }

    return (
        <div
            data-cy={`can-card-${can.display_name}`}
            className={style.container}
        >
            <Link
                to={`/cans/${can.id}`}
                className="text-no-underline text-ink"
            >
                <dl className={`margin-0 ${style.leftMarginContainer}`}>
                    <dt className="margin-0 text-base-dark">CAN</dt>
                    <dd className="text-semibold margin-0 margin-bottom-2">{can.display_name}</dd>
                    <dt className="margin-0 text-base-dark">Nickname</dt>
                    <dd className="text-semibold margin-0 margin-bottom-2">{can.nick_name}</dd>
                    <dt className="margin-0 text-base-dark">Active Period</dt>
                    <dd className="text-semibold margin-0 margin-bottom-2">
                        {can.active_period} {can.active_period > 1 ? "years" : "year"}
                    </dd>
                    <dt className="margin-0 text-base-dark">Obligate By</dt>
                    <dd className="text-semibold margin-0">{formatDateNeeded(obligateBy.toDateString())}</dd>
                </dl>
            </Link>
            <div className={style.rightContainer}>
                <div className="display-flex flex-justify flex-align-center">
                    <p className="margin-0 font-12px text-base-dark">{`FY ${fiscalYear} CAN Budget`}</p>
                    {can.active_period === 1 || (can.active_period !== 1 && fiscalYear === appropriationYear) ? (
                        <Tag
                            text={`FY ${fiscalYear} New Funding`}
                            className="bg-brand-data-viz-secondary-20 text-white"
                        />
                    ) : (
                        <Tag
                            text="Previous FYs Carry-Forward"
                            className="bg-brand-portfolio-carry-forward"
                        />
                    )}
                </div>
                {canFundingData?.total_funding === 0 ? (
                    <span
                        className="text-bold"
                        style={{ fontSize: "20px" }}
                    >
                        TBD
                    </span>
                ) : (
                    <CurrencyFormat
                        className="text-bold"
                        style={{ fontSize: "20px" }}
                        value={canFundingData?.total_funding}
                        displayType={"text"}
                        thousandSeparator={true}
                        prefix="$"
                        decimalScale={2}
                        fixedDecimalScale
                    />
                )}
                <section
                    id="received-expected-chart"
                    className="margin-top-3"
                >
                    <div className="display-flex flex-justify font-12px margin-bottom-05">
                        <div>
                            <CurrencyFormat
                                value={canFundingData?.received_funding ?? 0}
                                displayType={"text"}
                                thousandSeparator={true}
                                prefix={"$"}
                                decimalScale={canFundingData?.received_funding === 0 ? 0 : 2}
                                fixedDecimalScale
                            />{" "}
                            <span>Received</span>
                        </div>
                        <div>
                            <CurrencyFormat
                                value={canFundingData?.expected_funding ?? 0}
                                displayType={"text"}
                                thousandSeparator={true}
                                prefix={"$"}
                                decimalScale={canFundingData?.expected_funding === 0 ? 0 : 2}
                                fixedDecimalScale
                            />{" "}
                            <span>Expected</span>
                        </div>
                    </div>
                    <ReverseLineGraph data={receivedExpectedData} />
                </section>
                <section
                    id="spending-available-chart"
                    className="margin-top-3"
                >
                    <div className="display-flex flex-justify font-12px margin-bottom-05">
                        <div>
                            <CurrencyFormat
                                value={spendingAmount ?? 0}
                                displayType={"text"}
                                thousandSeparator={true}
                                prefix={"$"}
                                decimalScale={spendingAmount === 0 ? 0 : 2}
                                fixedDecimalScale
                            />{" "}
                            <span>Spending</span>
                        </div>
                        <div>
                            <CurrencyFormat
                                value={canFundingData?.available_funding ?? 0}
                                displayType={"text"}
                                thousandSeparator={true}
                                prefix={"$"}
                                decimalScale={canFundingData?.available_funding === 0 ? 0 : 2}
                                fixedDecimalScale
                            />{" "}
                            <span>Available</span>
                        </div>
                    </div>
                    <LineGraph
                        data={spendingAvailableData}
                        isStriped={true}
                    />
                </section>
            </div>
        </div>
    );
};

export default CanCard;
