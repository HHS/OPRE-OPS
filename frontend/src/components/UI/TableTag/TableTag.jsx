import PropTypes from "prop-types";
import { convertCodeForDisplay } from "../../../helpers/utils";
import Tag from "../Tag/Tag";

/**
 * A component that displays a tag with a background color based on the status code.
 * @component
 * @param {object} props - The component props.
 * @param {string} props.status - The status code to display.
 * @param {boolean} [props.inReview] - Whether or not the tag is in review.
 * @returns {JSX.Element} - The rendered component.
 */
const TableTag = ({ status, inReview = false }) => {
    const statusText = convertCodeForDisplay("budgetLineStatus", status);
    let classNames = "padding-x-105 padding-y-1 ";

    if (inReview) {
        return (
            <Tag
                className="bg-brand-data-viz-primary-9 text-white"
                text="In Review"
            />
        );
    }

    switch (statusText) {
        case "Draft":
            classNames += "bg-brand-neutral-lighter text-ink";
            break;
        case "Planned":
            classNames += "bg-brand-data-viz-primary-11 text-white";
            break;
        case "Executing":
            classNames += "bg-brand-data-viz-primary-8 text-ink";
            break;
        case "Obligated":
            classNames += "bg-brand-data-viz-primary-6 text-white";
            break;
        default:
    }

    return (
        <Tag
            className={classNames}
            text={statusText}
        />
    );
};

TableTag.propTypes = {
    status: PropTypes.string.isRequired,
    inReview: PropTypes.bool
};

export default TableTag;
