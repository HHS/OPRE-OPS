import PropTypes from "prop-types";
import { dateToYearMonthDay } from "../ServicesComponents.helpers";
import Tag from "../../UI/Tag";

/**
 * ServicesComponentMetadata displays metadata for a service component.
 * It shows the start and end period of the service, as well as a description.
 *
 * @component
 * @param {Object} props - The properties that define the component.
 * @param {string} props.periodStart - The start date of the service period in ISO 8601 format (YYYY-MM-DD).
 * @param {string} props.periodEnd - The end date of the service period in ISO 8601 format (YYYY-MM-DD).
 * @param {string} props.description - The description of the service.
 * @returns {JSX.Element} The rendered ServicesComponentMetadata component.
 */
function ServicesComponentMetadata({ periodStart, periodEnd, description }) {
    const { year: popStartYear, month: popStartMonth, day: popStartDay } = dateToYearMonthDay(periodStart);
    const { year: popEndYear, month: popEndMonth, day: popEndDay } = dateToYearMonthDay(periodEnd);
    return (
        <section className="margin-top-0">
            <dl className="display-flex font-12px">
                <div>
                    <dt className="margin-0 text-base-dark margin-top-1px">Period of Performance - Start</dt>
                    <dd className="margin-0 margin-top-1">
                        <Tag tagStyle="primaryDarkTextLightBackground">
                            {popStartYear && popStartMonth && popStartDay
                                ? `${popStartMonth}/${popStartDay}/${popStartYear}`
                                : "TBD"}
                        </Tag>
                    </dd>
                </div>
                <div className="margin-left-4">
                    <dt className="margin-0 text-base-dark margin-top-1px">Period of Performance - End</dt>
                    <dd className="margin-0 margin-top-1">
                        <Tag tagStyle="primaryDarkTextLightBackground">
                            {popEndYear && popEndMonth && popEndDay
                                ? `${popEndMonth}/${popEndDay}/${popEndYear}`
                                : "TBD"}
                        </Tag>
                    </dd>
                </div>
                <div
                    className="margin-left-8"
                    style={{ width: "25rem" }}
                >
                    <dt className="margin-0 text-base-dark margin-top-1px">Description</dt>
                    <dd className="margin-0 margin-top-05 text-semibold">{description}</dd>
                </div>
            </dl>
        </section>
    );
}
ServicesComponentMetadata.propTypes = {
    periodStart: PropTypes.string.isRequired,
    periodEnd: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired
};
export default ServicesComponentMetadata;
