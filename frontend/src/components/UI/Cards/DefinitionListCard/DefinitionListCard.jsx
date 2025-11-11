import React from "react";
/**
 * @typedef {import("../../../../types/DefinitionListTypes").DefinitionListItem} DefinitionListItem
 * @param {Object} props
 * @param {DefinitionListItem[]} props.definitionList - An array of objects representing the definition list items. Each object should have 'term' and 'definition' properties.
 * @param {string} [props.className] - Optional additional class names to apply to the card container.
 * @returns {React.ReactElement} The DefinitionListCard component.
 */
const DefinitionListCard = ({ definitionList, className = "" }) => {
    return (
        <div
            className={`bg-base-lightest font-family-sans font-12px border-1px border-base-light radius-md margin-top-4 ${className}`}
        >
            {definitionList.length === 0 && <p className="margin-0 text-italic">No items to display.</p>}

            <dl className="margin-0 padding-y-2 padding-x-3">
                {definitionList.map(({ term, definition }, index) => (
                    <React.Fragment key={term}>
                        <dt className={`margin-0 text-base-dark ${index > 0 ? "margin-top-2" : ""}`}>{term}</dt>
                        <dd className="margin-0 text-bold margin-top-1 text-ink">{definition}</dd>
                    </React.Fragment>
                ))}
            </dl>
        </div>
    );
};

export default DefinitionListCard;
