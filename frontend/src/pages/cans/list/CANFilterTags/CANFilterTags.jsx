import _ from "lodash";
import FilterTags from "../../../../components/UI/FilterTags";
import FilterTagsWrapper from "../../../../components/UI/FilterTags/FilterTagsWrapper";
import { removeFilter, useTagsList } from "./CANFilterTags.hooks";

/**
 * A filter tags component.
 * @typedef {import('./CANFilterTags.hooks').Filters} Filters
 * @param {Object} props - The component props.
 * @param {Filters} props.filters - The filters.
 * @param {Function} props.setFilters - A function to call to set the filters.
 * @param {[number, number]} props.fyBudgetRange - The initial budget range.
 * @returns {JSX.Element|null} The filter tags component or null if no tags.
 */
const CANFilterTags = ({ filters, setFilters, fyBudgetRange }) => {
    const tagsList = useTagsList(filters, fyBudgetRange);

    const tagsListByFilter = _.groupBy(tagsList, "filter");
    const tagsListByFilterMerged = Object.values(tagsListByFilter).flat();

    if (tagsList.length === 0) {
        return null;
    }

    return (
        <FilterTagsWrapper>
            <FilterTags
                removeFilter={(tag) => removeFilter(tag, setFilters)}
                tagsList={tagsListByFilterMerged}
            />
        </FilterTagsWrapper>
    );
};
export default CANFilterTags;
