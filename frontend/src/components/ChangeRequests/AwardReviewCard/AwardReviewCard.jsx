import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { convertToCurrency, formatDateToMonthDayYear } from "../../../helpers/utils";
import { useGetAgreementName } from "../../../hooks/lookup.hooks";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import Tag from "../../UI/Tag/Tag";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * AwardReviewCard — For Review card for pending award approvals (OPS-2280).
 *
 * Shows Agreement, Requested by, Award Amount, and Award Date, with a
 * "Review Agreement" link that navigates to the award approval review page.
 *
 * @component
 * @param {Object} props
 * @param {number} props.agreementId
 * @param {number} props.requestorId
 * @param {string} props.requestDate
 * @param {number} [props.awardAmount]
 * @param {string} [props.awardDate]
 */
function AwardReviewCard({ agreementId, requestorId, requestDate, awardAmount, awardDate }) {
    const navigate = useNavigate();
    const agreementName = useGetAgreementName(agreementId);
    const requestorName = useGetUserFullNameFromId(requestorId);

    const handleViewClick = (e) => {
        e.preventDefault();
        navigate(`/agreements/${agreementId}/review-award`);
    };

    return (
        <div
            className="width-full padding-2 margin-top-4 bg-white hover:bg-base-lightest border-2px radius-lg border-base-light hover:border-base-lighter"
            data-cy="award-review-card"
            data-testid="award-review-card"
            style={{
                minHeight: "8.375rem",
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                gridTemplateRows: "auto auto auto",
                gap: "1rem"
            }}
        >
            {/* Row 1, Col 1: Heading */}
            <div
                className="grid-col-1"
                style={{ whiteSpace: "nowrap" }}
            >
                <h2 className="margin-0 font-sans-sm">Award</h2>
            </div>

            {/* Row 1, Cols 2-7: Agreement name */}
            <dl
                className="font-12px margin-0 display-flex flex-column"
                style={{ gridColumn: "2 / 7", gap: "0.5rem" }}
            >
                <dt className="text-base-dark">Agreement</dt>
                <dd className="margin-0">{agreementName}</dd>
            </dl>

            {/* Requested by */}
            <dl
                className="font-12px margin-0 display-flex flex-column"
                style={{ gap: "0.5rem" }}
            >
                <dt className="text-base-dark">Requested by</dt>
                <dd className="margin-0">{requestorName || "Unknown"}</dd>
            </dl>

            {/* Award Amount */}
            <dl
                className="font-12px margin-0 display-flex flex-column"
                style={{ gap: "0.5rem" }}
            >
                <dt className="text-base-dark">Award Amount</dt>
                <dd className="margin-0">
                    <Tag
                        tagStyle="primaryDarkTextLightBackground"
                        text={awardAmount != null ? convertToCurrency(awardAmount) : "—"}
                    />
                </dd>
            </dl>

            {/* Award Date */}
            <dl
                className="font-12px margin-0 display-flex flex-column"
                style={{ gridColumn: "3 / 5", gap: "0.5rem" }}
            >
                <dt className="text-base-dark">Award Date</dt>
                <dd className="margin-0">
                    <Tag
                        tagStyle="primaryDarkTextLightBackground"
                        text={awardDate ? formatDateToMonthDayYear(awardDate) : "—"}
                    />
                </dd>
            </dl>

            {/* Footer: request date + Review Agreement button */}
            <footer
                className="font-12px display-flex flex-justify flex-align-center"
                style={{ gridColumn: "1 / 7" }}
            >
                <div className="text-base-dark display-flex flex-align-center">
                    <FontAwesomeIcon
                        icon={faClock}
                        className="height-2 width-2 margin-right-1"
                        aria-hidden="true"
                    />
                    {formatDateToMonthDayYear(requestDate)}
                </div>
                <button
                    type="button"
                    onClick={handleViewClick}
                    className="usa-button--unstyled text-primary font-12px cursor-pointer"
                    data-cy="review-agreement-button"
                    aria-label={`Review agreement ${agreementName}`}
                >
                    Review Agreement
                    <FontAwesomeIcon
                        icon={faEye}
                        size="3x"
                        className="height-2 width-2 margin-left-1"
                    />
                </button>
            </footer>
        </div>
    );
}

AwardReviewCard.propTypes = {
    agreementId: PropTypes.number.isRequired,
    requestorId: PropTypes.number.isRequired,
    requestDate: PropTypes.string.isRequired,
    awardAmount: PropTypes.number,
    awardDate: PropTypes.string
};

export default AwardReviewCard;
