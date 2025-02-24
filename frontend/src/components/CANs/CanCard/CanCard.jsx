import CurrencyFormat from "react-currency-format";
import { useGetCanFundingSummaryQuery } from "../../../api/opsAPI";
import { formatDateNeeded } from "../../../helpers/utils";
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
    const expirationDate = new Date(canFundingData?.cans[0].expiration_date);
    const obligateBy = new Date(expirationDate);
    obligateBy.setDate(obligateBy.getDate() - 1);

    const appropriationYear = obligateBy.getFullYear() - can?.active_period;

    const receivedExpectedData = [
        {
            id: 1,
            value: canFundingData?.received_funding,
            color: "var(--data-viz-budget-graph-1)"
        },
        {
            id: 2,
            value: canFundingData?.total_funding,
            color: "var(--data-viz-budget-graph-2)"
        }
    ];

    const spendingAmount =
        canFundingData?.planned_funding + canFundingData?.in_execution_funding + canFundingData?.obligated_funding;

    const spendingAvailableData = [
        {
            id: 1,
            value: spendingAmount,
            color: "var(--data-viz-budget-graph-2)"
        },
        {
            id: 2,
            value: canFundingData?.total_funding,
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
            <dl className={`margin-0 ${style.leftMarginContainer}`}>
                <Link
                    to={`/cans/${can.id}`}
                    className="text-no-underline text-ink"
                >
                    <div>
                        <dt className="margin-0 text-base-dark">CAN</dt>
                        <dd className="text-semibold margin-0">{can.display_name}</dd>
                    </div>
                    <div className="margin-y-2">
                        <dt className="margin-0 text-base-dark">Nickname</dt>
                        <dd className="text-semibold margin-0">{can.nick_name}</dd>
                    </div>
                    <div className="margin-y-2">
                        <dt className="margin-0 text-base-dark">Active Period</dt>
                        <dd className="text-semibold margin-0">
                            {can.active_period} {can.active_period > 1 ? "years" : "year"}
                        </dd>
                    </div>
                    <div className="margin-y-2">
                        <dt className="margin-0 text-base-dark">Obligate By</dt>
                        <dd className="text-semibold margin-0">{formatDateNeeded(obligateBy.toDateString())}</dd>
                    </div>
                </Link>
            </dl>
            <div className={style.rightContainer}>
                <div className="display-flex flex-justify flex-align-center">
                    <p className="margin-0 font-12px text-base-dark">{`FY ${fiscalYear} CAN Budget`}</p>
                    {can.active_period === 1 || fiscalYear !== appropriationYear ? (
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

                <CurrencyFormat
                    className="text-bold"
                    style={{ fontSize: "20px" }}
                    value={canFundingData?.total_funding ?? 0}
                    displayType={"text"}
                    thousandSeparator={true}
                    prefix={"$"}
                    decimalScale={canFundingData?.total_funding === 0 ? 0 : 2}
                    fixedDecimalScale
                />
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
