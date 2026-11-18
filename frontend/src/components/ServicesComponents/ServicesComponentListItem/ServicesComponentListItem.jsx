import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { scrollToCenter } from "../../../helpers/scrollToCenter.helper";
import Tooltip from "../../UI/USWDS/Tooltip";
import ServicesComponentMetadata from "../ServicesComponentMetadata";
/**
 * @component - ServicesComponentListItem is a component that displays a single service component item.
 * @param {object} props
 * @param {number} props.id - The ID of the service component.
 * @param {number} props.number - The number of the service component.
 * @param {string} props.title - The title of the service component.
 * @param {string} props.periodStart - The start date of the period of performance.
 * @param {string} props.periodEnd - The end date of the period of performance.
 * @param {string} props.description - The description of the service component.
 * @param {Function} props.setFormDataById - Function to set form data by ID.
 * @param {Function} props.handleDelete - Function to handle delete operation.
 * @param {boolean} [props.isSubComponent] - Indicates if the item is a sub-component.
 * @param {string} [props.lockedMessage] - When set, the item has a change in review: edit and delete are disabled and this is their tooltip (OPS-6440).
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
    handleDelete,
    isSubComponent,
    lockedMessage = ""
}) {
    const [isHovered, setIsHovered] = React.useState(false);
    const [hasFocusWithin, setHasFocusWithin] = React.useState(false);
    // The Edit/Delete buttons show on hover, and also while one has keyboard focus: they're always
    // rendered (just transparent), so keyboard users can tab to them (WCAG 2.1.1).
    const showActions = isHovered || hasFocusWithin;

    const isFirstServiceComponent = number === 1;
    const isLocked = Boolean(lockedMessage);
    const isEditDisabled = Boolean(isLocked || isSubComponent);
    const isDeleteDisabled = Boolean(isLocked || isSubComponent || isFirstServiceComponent);

    const SUB_COMPONENT_DISABLED_MSG = "Sub-Services Components are from legacy contracts and cannot be edited";
    const FIRST_SERVICE_COMPONENT_DISABLED_MSG = "All agreements must start with an SC1 or Base Period";

    // A change in review takes precedence: it's the reason the user can act on.
    const disabledEditMsg = isLocked ? lockedMessage : SUB_COMPONENT_DISABLED_MSG;
    const disabledDeleteMsg = isLocked
        ? lockedMessage
        : isSubComponent
          ? SUB_COMPONENT_DISABLED_MSG
          : FIRST_SERVICE_COMPONENT_DISABLED_MSG;

    return (
        <div
            className="width-full flex-column padding-2 margin-top-4 bg-white hover:bg-base-lightest border-base-light hover:border-base-lighter border-2px radius-lg"
            style={{ minHeight: "8.375rem" }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => setHasFocusWithin(true)}
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setHasFocusWithin(false);
            }}
        >
            <section className="display-flex flex-justify">
                <h2
                    className="margin-0"
                    style={{ fontSize: "16px", fontWeight: "600" }}
                    data-cy={`${title}-services-component-item-title`}
                >
                    {title}
                </h2>
                <div
                    style={{ opacity: showActions ? 1 : 0 }}
                    data-cy="services-component-item-actions"
                    data-testid="services-component-item-actions"
                >
                    <Tooltip
                        label={isEditDisabled ? disabledEditMsg : "Edit"}
                        position="top"
                        className="line-height-body-1"
                    >
                        <button
                            type="button"
                            aria-label={isEditDisabled ? disabledEditMsg : `Edit ${title}`}
                            data-cy="services-component-item-edit-button"
                            onClick={() => {
                                if (isEditDisabled) return;
                                setFormDataById(id);
                                scrollToCenter("services-component-form");
                            }}
                            // aria-disabled, not disabled: a disabled button can't take focus, so
                            // keyboard users couldn't reach the tooltip saying why.
                            aria-disabled={isEditDisabled}
                        >
                            <FontAwesomeIcon
                                icon={faPen}
                                size="2x"
                                className={`${
                                    isEditDisabled ? "text-gray-30 cursor-not-allowed" : "text-primary cursor-pointer"
                                } height-2 width-2 margin-right-1`}
                            />
                        </button>
                    </Tooltip>
                    <Tooltip
                        label={`${isDeleteDisabled ? disabledDeleteMsg : "Delete"}`}
                        position="top"
                        className="line-height-body-1"
                    >
                        <button
                            type="button"
                            aria-label={isDeleteDisabled ? disabledDeleteMsg : `Delete ${title}`}
                            data-cy="services-component-item-delete-button"
                            onClick={() => {
                                if (isDeleteDisabled) return;
                                handleDelete(id);
                            }}
                            aria-disabled={isDeleteDisabled}
                        >
                            <FontAwesomeIcon
                                icon={faTrash}
                                size="2x"
                                className={`${
                                    isDeleteDisabled ? "text-gray-30 cursor-not-allowed" : "text-primary cursor-pointer"
                                } height-2 width-2 `}
                            />
                        </button>
                    </Tooltip>
                </div>
            </section>
            <ServicesComponentMetadata
                periodStart={periodStart}
                periodEnd={periodEnd}
                description={description}
            />
        </div>
    );
}

export default ServicesComponentListItem;
