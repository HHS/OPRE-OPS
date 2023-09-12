import icons from "../../../uswds/img/sprite.svg";

/**
 * A filter tags.
 * @param {Object} props - The component props.
 * @param {Function} props.removeFilter - A function to call to remove a filter/tag.
 * @param {array} props.tagsList - An array of tags to display.
 * @returns {JSX.Element} - The procurement shop select element.
 */
export const FilterTags = ({ removeFilter, tagsList }) => {
    const FilterTag = ({ tag }) => (
        <div className="font-12px height-205 radius-md bg-brand-primary-light display-flex flex-align-center width-fit-content">
            {tag.tagText}
            <svg
                className="height-2 width-2 text-primary-dark margin-left-05 hover: cursor-pointer usa-tooltip"
                onClick={() => removeFilter(tag)}
                id={`filter-tag-${tag.filter}`}
            >
                <use xlinkHref={`${icons}#cancel`}></use>
            </svg>
        </div>
    );

    return (
        <div className="display-flex flex-align-center flex-wrap">
            {tagsList.map((tag, index) => {
                return (
                    <span key={index} className="padding-right-205 padding-top-05">
                        <FilterTag tag={tag} />
                    </span>
                );
            })}
        </div>
    );
};
export default FilterTags;
