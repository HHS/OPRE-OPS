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
    switch (statusText) {
        case "Draft":
            inReview
                ? (classNames += "bg-transparent text-brand-primary border")
                : (classNames += "bg-brand-neutral-lighter text-ink");
            break;
        case "Planned":
            inReview
                ? (classNames += "bg-transparent text-brand-data-viz-primary-8 border")
                : (classNames += "bg-brand-data-viz-primary-11 text-white");

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
            text={inReview ? "In Review" : statusText}
        />
    );
};

TableTag.propTypes = {
    status: PropTypes.string.isRequired,
    inReview: PropTypes.bool
};

export default TableTag;
