import { convertCodeForDisplay } from "../../../helpers/utils";
import Tag from "../Tag/Tag";

/**
 * A component that displays a tag with a background color based on the status code.
 * @typedef {Object} TableTagProps
 * @property {string} status - The status code to display.
 */

/**
 * A component that displays a tag with a background color based on the status code.
 * @param {TableTagProps} props - The component props.
 * @returns {JSX.Element} - The rendered component.
 */
export const TableTag = ({ status }) => {
    const statusText = convertCodeForDisplay("budgetLineType", status);
    let classNames = "padding-x-105 padding-y-1 ";
    switch (statusText) {
        case "Draft":
            classNames += "bg-brand-neutral-lighter";
            break;
        case "In Review":
            classNames += "bg-brand-data-viz-secondary-23 text-white";
            break;
        case "Executing":
            classNames += "bg-brand-data-viz-primary-8";
            break;
        case "Obligated":
            classNames += "bg-brand-data-viz-primary-6 text-white";
            break;
        case "Planned":
            classNames += "bg-brand-data-viz-primary-11 text-white";
            break;
        default:
    }

    return <Tag className={classNames} text={statusText} />;
};

export default TableTag;
