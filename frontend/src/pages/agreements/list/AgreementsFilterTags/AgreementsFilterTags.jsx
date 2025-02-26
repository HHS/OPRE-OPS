import _ from "lodash";
import FilterTags from "../../../../components/UI/FilterTags/FilterTags";
import FilterTagsWrapper from "../../../../components/UI/FilterTags/FilterTagsWrapper";
import { removeFilter, useTagsList } from "./AgreementsFilterTags.hooks"
/**
 * A filter tags.
 * @param {Object} props - The component props.
 * @param {import("./AgreementsFilterTags.hooks").Filters} props.filters - The current filters.
 * @param {Function} props.setFilters - A function to call to set the filters.
 * @returns {JSX.Element} - The procurement shop select element.
 */
export const AgreementsFilterTags = ({ filters, setFilters }) => {
    const tagsList = useTagsList(filters);

    const tagsListByFilter = _.groupBy(tagsList, "filter");
    const tagsListByFilterMerged = Object.values(tagsListByFilter).flat();

    return (
        !_.isEmpty(tagsList) && (
            <FilterTagsWrapper>
                <FilterTags
                    removeFilter={(tag) => removeFilter(tag, setFilters)}
                    tagsList={tagsListByFilterMerged}
                />
            </FilterTagsWrapper>
        )
    );
};
export default AgreementsFilterTags;
