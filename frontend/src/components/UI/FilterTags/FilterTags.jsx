import icons from "../../../uswds/img/sprite.svg";
import Tag from "../Tag";

/**
 * A filter tags.
 * @param {Object} props - The component props.
 * @param {Function} props.removeFilter - A function to call to remove a filter/tag.
 * @param {Array<string>} props.tagsList - An array of tags to display.
 * @returns {React.JSX.Element} - The procurement shop select element.
 */
export const FilterTags = ({ removeFilter, tagsList }) => {
    const FilterTag = ({ tag }) => (
        <Tag className="bg-brand-primary-light display-flex flex-align-center">
            {tag.tagText}
            <svg
                className="height-2 width-2 text-primary-dark margin-left-05 hover: cursor-pointer usa-tooltip"
                onClick={() => removeFilter(tag)}
                id={`filter-tag-${tag.filter}`}
            >
                <use xlinkHref={`${icons}#cancel`}></use>
            </svg>
        </Tag>
    );

    return (
        <div className="display-flex flex-align-center flex-wrap">
            {tagsList.map((tag, index) => {
                return (
                    <span
                        key={index}
                        className="padding-right-205 padding-top-05"
                    >
                        <FilterTag tag={tag} />
                    </span>
                );
            })}
        </div>
    );
};
export default FilterTags;
