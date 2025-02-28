import React from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import ServicesComponentMetadata from "../ServicesComponentMetadata";
import Tooltip from "../../UI/USWDS/Tooltip";
/**
 * ServicesComponentListItem is a component that displays a single service component item.
 *
 * @component
 * @param {object} props
 * @param {number} props.id - The ID of the service component.
 * @param {number} props.number - The number of the service component.
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
function ServicesComponentListItem({
    id,
    number,
    title,
    periodStart,
    periodEnd,
    setFormDataById,
    description,
    handleDelete
}) {
    const [isHovered, setIsHovered] = React.useState(false);
    const isFirstServiceComponent = number === 1;
    const disabledMsg = "all agreements must start with an SC1 or Base Period";

    const scrollToCenter = () => {
        const element = document.getElementById("services-component-form");
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    };

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
                        <Tooltip
                            label="Edit"
                            position="top"
                        >
                            <button
                                id="edit"
                                aria-label="Edit"
                                onClick={() => {
                                    setFormDataById(id);
                                    scrollToCenter();
                                }}
                            >
                                <FontAwesomeIcon
                                    icon={faPen}
                                    size="2x"
                                    className="text-primary height-2 width-2 margin-right-1 cursor-pointer"
                                />
                            </button>
                        </Tooltip>
                        <Tooltip
                            label={`${isFirstServiceComponent ? disabledMsg : "Delete"}`}
                            position="top"
                        >
                            <button
                                id="delete"
                                aria-label={`${isFirstServiceComponent ? disabledMsg : "Delete"}`}
                                onClick={() => {
                                    handleDelete(id);
                                }}
                                disabled={isFirstServiceComponent}
                            >
                                <FontAwesomeIcon
                                    icon={faTrash}
                                    size="2x"
                                    className={`${
                                        isFirstServiceComponent ? "text-gray-30" : "text-primary"
                                    } height-2 width-2 cursor-pointer`}
                                />
                            </button>
                        </Tooltip>
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
    number: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    periodStart: PropTypes.string.isRequired,
    periodEnd: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    setFormDataById: PropTypes.func.isRequired,
    handleDelete: PropTypes.func.isRequired
};

export default ServicesComponentListItem;
