import PropTypes from "prop-types";
import RoundedBox from "../../../components/UI/RoundedBox";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import Tag from "../../../components/UI/Tag";
import { dateToYearMonthDay } from "../servicesComponents.helpers";

/**
 * ServicesComponentListItem is a component that displays a single service component item.
 *
 * @component
 * @param {object} props
 * @param {number} props.id - The ID of the service component.
 * @param {string} props.title - The title of the service component.
 * @param {string} props.periodStart - The start date of the period of performance.
 * @param {string} props.periodEnd - The end date of the period of performance.
 * @param {string} props.description - The description of the service component.
 * @param {Function} props.setFormDataById - Function to set form data by ID.
 * @param {Function} props.handleDelete - Function to handle delete operation.
 * @returns {JSX.Element}
 *
 * @example
 * <ServicesComponentListItem item={item} setFormDataById={setFormDataById} handleDelete={handleDelete} />
 */
function ServicesComponentListItem({ id, title, periodStart, periodEnd, setFormDataById, description, handleDelete }) {
    const { year: popStartYear, month: popStartMonth, day: popStartDay } = dateToYearMonthDay(periodStart);
    const { year: popEndYear, month: popEndMonth, day: popEndDay } = dateToYearMonthDay(periodEnd);

    return (
        <RoundedBox
            className="width-full flex-column padding-2 margin-top-4"
            style={{ width: "100%", height: "auto", minHeight: "8.375rem" }}
        >
            <section className="display-flex flex-justify">
                <h2 className="margin-0">{title}</h2>
                <div>
                    <button
                        id="edit"
                        onClick={() => setFormDataById(id)}
                    >
                        <FontAwesomeIcon
                            icon={faPen}
                            size="2x"
                            className="text-primary height-2 width-2 margin-right-1 cursor-pointer usa-tooltip"
                            title="edit"
                            data-position="top"
                        />
                    </button>
                    <button
                        id="delete"
                        onClick={() => {
                            handleDelete(id);
                        }}
                    >
                        <FontAwesomeIcon
                            icon={faTrash}
                            size="2x"
                            className="text-primary height-2 width-2 cursor-pointer usa-tooltip"
                            title="delete"
                            data-position="top"
                        />
                    </button>
                </div>
            </section>
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
        </RoundedBox>
    );
}

ServicesComponentListItem.propTypes = {
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    periodStart: PropTypes.string.isRequired,
    periodEnd: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    setFormDataById: PropTypes.func.isRequired,
    handleDelete: PropTypes.func.isRequired
};

export default ServicesComponentListItem;
