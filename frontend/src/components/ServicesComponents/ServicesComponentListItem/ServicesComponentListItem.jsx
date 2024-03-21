import React from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import ServicesComponentMetadata from "../ServicesComponentMetadata";
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
    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <div
            className="width-full flex-column padding-2 margin-top-4 bg-white hover:bg-base-lightest border-base-light hover:border-base-lighter border-2px radius-lg"
            style={{ minHeight: "8.375rem" }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <section className="display-flex flex-justify">
                <h2 className="margin-0">{title}</h2>
                {isHovered && (
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
                )}
            </section>
            <ServicesComponentMetadata
                periodStart={periodStart}
                periodEnd={periodEnd}
                description={description}
            />
        </div>
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
