import { convertCodeForDisplay } from "../../../helpers/utils";
import Tag from "../Tag/Tag";
import tag from "../Tag/Tag";
import * as React from "react";

const statusClasses = {
    DRAFT: "bg-brand-neutral-lighter",
    UNDER_REVIEW: "bg-brand-data-viz-secondary-23 text-white",
    PLANNED: "bg-brand-data-viz-primary-11 text-white",
    IN_EXECUTION: "bg-brand-data-viz-primary-8",
    OBLIGATED: "bg-brand-data-viz-primary-6 text-white",
}

export const statuses = Object.keys(statusClasses);

/**
 * A component that displays a tag with a background color based on the status code.
 * @typedef {Object} StatusTagProps
 * @property {string} status - The status code to display.
 * @property {number} count - (Optional) The number to be shown before the status
 */

/**
 * A component that displays a tag with a background color based on the status code.
 * @param {StatusTagProps} props - The component props.
 * @returns {JSX.Element} - The rendered component.
 */
export const StatusTag = ({ status, count = -1}) => {
    const statusText = convertCodeForDisplay("budgetLineStatus", status);
    let classNames = "margin-bottom-1 ";
    if (statusClasses[status]) {
        classNames += statusClasses[status]
    }
    const tagText = count >= 0 ? `${count} ${statusText}` : statusText
    return <Tag className={classNames} text={tagText} />;
};

export const StatusTagList = ({countsByStatus}) => {
    const zerosForAllStatuses = statuses.reduce((obj, status) => {
        obj[status] = 0;
        return obj;
    }, {});
    const countsByStatusWithZeros = {...zerosForAllStatuses, ...countsByStatus}

    return (
        <>
            { Object.entries(countsByStatusWithZeros).map(([key,value],i) =>
                <StatusTag status={key} count={value} key={key}/>
            )}
        </>
    )
}


export default StatusTag;
