import Tag from "../../UI/Tag";
import { dateToYearMonthDay } from "../../ServicesComponents/ServicesComponents.helpers";

/**
 * GrantNumberMetadata displays the period of performance and description for a grant number.
 * PoP Start and End render on one row; Description renders full-width below.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.periodStart] - ISO 8601 date string for PoP start.
 * @param {string} [props.periodEnd] - ISO 8601 date string for PoP end.
 * @param {string} [props.description] - Description of the grant number.
 * @returns {JSX.Element}
 */
function GrantNumberMetadata({ periodStart, periodEnd, description }) {
    const { year: startYear, month: startMonth, day: startDay } = dateToYearMonthDay(periodStart);
    const { year: endYear, month: endMonth, day: endDay } = dateToYearMonthDay(periodEnd);

    return (
        <section className="margin-top-0">
            <dl className="display-flex font-12px">
                <div>
                    <dt className="margin-0 text-base-dark margin-top-1px">Period of Performance - Start</dt>
                    <dd className="margin-0 margin-top-1">
                        <Tag tagStyle="primaryDarkTextLightBackground">
                            {startYear && startMonth && startDay ? `${startMonth}/${startDay}/${startYear}` : "TBD"}
                        </Tag>
                    </dd>
                </div>
                <div className="margin-left-4">
                    <dt className="margin-0 text-base-dark margin-top-1px">Period of Performance - End</dt>
                    <dd className="margin-0 margin-top-1">
                        <Tag tagStyle="primaryDarkTextLightBackground">
                            {endYear && endMonth && endDay ? `${endMonth}/${endDay}/${endYear}` : "TBD"}
                        </Tag>
                    </dd>
                </div>
                <div className="margin-left-8">
                    <dt className="margin-0 text-base-dark margin-top-1px">Description</dt>
                    <dd className="margin-0 margin-top-05 text-semibold">{description}</dd>
                </div>
            </dl>
        </section>
    );
}

export default GrantNumberMetadata;
