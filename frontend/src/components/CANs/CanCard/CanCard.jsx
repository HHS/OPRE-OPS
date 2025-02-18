import { useGetCanFundingSummaryQuery } from "../../../api/opsAPI";
import DebugCode from "../../DebugCode";
import style from "./styles.module.css";

/**
 * @component CanCard
 * @description Displays the CAN card
 * @param {Object} props - The props
 * @param {number} props.canId - The CAN id
 * @param {number} props.fiscalYear - The fiscal year
 * @returns {JSX.Element} - The CAN card
 */
const CanCard = ({ canId, fiscalYear }) => {
    /* Styling */
    const sectionClasses = `${style.container}`;
    const leftMarginClasses = `padding-y-205 ${style.leftMarginContainer}`;

    const { data: canFundingData, isLoading } = useGetCanFundingSummaryQuery({
        ids: [canId],
        fiscalYear: fiscalYear,
        refetchOnMountOrArgChange: true
    });

    const can = canFundingData?.cans[0].can;

    if (isLoading) {
        return <p>Loading...</p>;
    }

    return (
        <div className={sectionClasses}>
            <dl className={`margin-0 ${leftMarginClasses}`}>
                <div>
                    <dt className="margin-0 text-base-dark">CAN</dt>
                    <dd className="text-semibold margin-0">{can.display_name}</dd>
                </div>
                <div className="margin-y-3">
                    <dt className="margin-0 text-base-dark">Nickname</dt>
                    <dd className="text-semibold margin-0">{can.nick_name}</dd>
                </div>
                <div className="margin-y-3">
                    <dt className="margin-0 text-base-dark">Active Period</dt>
                    <dd className="text-semibold margin-0">
                        {can.active_period} {can.active_period > 1 ? "years" : "year"}
                    </dd>
                </div>
                <div className="margin-y-3">
                    <dt className="margin-0 text-base-dark">Obligate By</dt>
                    <dd className="text-semibold margin-0">Coming soon</dd>
                    {/* {formatDateNeeded(new Date(can.funding_details?.fiscal_year, 9, 1)) || "---"} (
                        {can.active_period} {can.active_period > 1 ? "years" : "year"}) */}
                </div>
            </dl>

            <DebugCode
                title="CanCard"
                data={{ canFundingData }}
            />
        </div>
    );
};

export default CanCard;
