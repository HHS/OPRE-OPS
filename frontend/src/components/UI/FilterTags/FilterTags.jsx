import icons from "../../../uswds/img/sprite.svg";
import Tag from "../Tag";

/**
 * @typedef {Object} Tag
 * @property {string} filter - The filter associated with the tag
 * @property {string} tagText - The text displayed on the tag
 */

/**
 * @description - A component to display a filter tag.
 * @component
 * @param {Object} props - The component props.
 * @param {Tag} props.tag - The tag to display.
 * @param {Function} props.removeFilter - A function to call to remove the tag.
 * @returns {JSX.Element} - The filter tag component. (A pill with an 'x' to remove it)
 */
const FilterTag = ({ tag, removeFilter }) => (
    <Tag className="bg-brand-primary-light text-brand-primary-dark display-flex flex-align-center">
        {tag.tagText}
        <svg
            className="height-2 width-2 margin-left-05 cursor-pointer"
            onClick={() => removeFilter(tag)}
            id={`filter-tag-${tag.filter}`}
            style={{ fill: "currentColor" }}
        >
            <use xlinkHref={`${icons}#cancel`}></use>
        </svg>
    </Tag>
);

/**
 * @description -  A component to display filter tags.
 * @component
 * @param {Object} props - The component props.
 * @param {Function} props.removeFilter - A function to call to remove a filter/tag.
 * @param {Tag[]} props.tagsList - An array of tags to display.
 * @returns {JSX.Element} - The filter tags component. (Pills with an 'x' to remove them)
 */
const FilterTags = ({ tagsList, removeFilter }) => {
    return (
        <div className="display-flex flex-align-center flex-wrap">
            {tagsList.map((tag, index) => {
                return (
                    <span
                        key={index}
                        className="padding-right-205 padding-top-05"
                    >
                        <FilterTag
                            tag={tag}
                            removeFilter={removeFilter}
                        />
                    </span>
                );
            })}
        </div>
    );
};
export default FilterTags;
