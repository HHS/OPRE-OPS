import { NO_DATA } from "../../../constants";
import Tag from "../../UI/Tag";
import { dateToYearMonthDay } from "../../ServicesComponents/ServicesComponents.helpers";

/**
 * GrantNumberMetadata displays the period of performance and description for a grant number.
 * PoP Start/End plus Grantee Recipient, Organization Type, and State render on one row;
 * Description renders full-width below.
 *
 * Grantee Recipient, Organization Type, and State are award-time fields — they are not populated
 * until after the grant is awarded. Each renders its value when present and falls back to "TBD"
 * (the `NO_DATA` sentinel) when absent, matching the PoP Start/End fallback in the same row. This
 * wires the display for real data without requiring it to exist yet; today the backend does not
 * serialize these fields on a grant number, so they render "TBD" until that pipeline lands.
 *
 * Note: this component intentionally diverges from ServicesComponentMetadata, which renders
 * the description beside the PoP tags in a single flex row. For grants the description is
 * a full-width block below the PoP row per product requirements, so the two components are
 * kept separate rather than shared.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.periodStart] - ISO 8601 date string for PoP start.
 * @param {string} [props.periodEnd] - ISO 8601 date string for PoP end.
 * @param {string} [props.granteeRecipient] - Grantee/recipient name (award-time; "TBD" when absent).
 * @param {string} [props.organizationType] - Recipient organization type (award-time; "TBD" when absent).
 * @param {string} [props.state] - Recipient state (award-time; "TBD" when absent).
 * @param {string} [props.description] - Description of the grant number.
 * @returns {JSX.Element}
 */
function GrantNumberMetadata({ periodStart, periodEnd, granteeRecipient, organizationType, state, description }) {
    const { year: startYear, month: startMonth, day: startDay } = dateToYearMonthDay(periodStart);
    const { year: endYear, month: endMonth, day: endDay } = dateToYearMonthDay(periodEnd);

    return (
        <section className="margin-top-0 margin-bottom-3 font-12px">
            <dl className="display-flex margin-0">
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
                <div className="margin-left-4">
                    <dt className="margin-0 text-base-dark margin-top-1px">Grantee Recipient</dt>
                    <dd className="margin-0 margin-top-1">
                        <Tag tagStyle="primaryDarkTextLightBackground">{granteeRecipient || NO_DATA}</Tag>
                    </dd>
                </div>
                <div className="margin-left-4">
                    <dt className="margin-0 text-base-dark margin-top-1px">Organization Type</dt>
                    <dd className="margin-0 margin-top-1">
                        <Tag tagStyle="primaryDarkTextLightBackground">{organizationType || NO_DATA}</Tag>
                    </dd>
                </div>
                <div className="margin-left-4">
                    <dt className="margin-0 text-base-dark margin-top-1px">State</dt>
                    <dd className="margin-0 margin-top-1">
                        <Tag tagStyle="primaryDarkTextLightBackground">{state || NO_DATA}</Tag>
                    </dd>
                </div>
            </dl>
            <dl className="margin-top-3 wrap-text margin-bottom-0">
                <dt className="margin-0 text-base-dark margin-top-1px">Description</dt>
                <dd className="margin-0 margin-top-1 text-semibold">{description}</dd>
            </dl>
        </section>
    );
}

export default GrantNumberMetadata;
