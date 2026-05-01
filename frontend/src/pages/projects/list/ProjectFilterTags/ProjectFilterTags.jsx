import { isEmpty, groupBy } from "lodash";
import FilterTags from "../../../../components/UI/FilterTags/FilterTags";
import FilterTagsWrapper from "../../../../components/UI/FilterTags/FilterTagsWrapper";
import { removeFilter, useTagsList } from "./ProjectFilterTags.hooks";
/**
 * A filter tags component for projects.
 * @param {Object} props - The component props.
 * @param {import("./ProjectFilterTags.hooks").Filters} props.filters - The current filters.
 * @param {Function} props.setFilters - A function to call to set the filters.
 * @returns {JSX.Element} - The project filter tags element.
 */
export const ProjectFilterTags = ({ filters, setFilters }) => {
    const tagsList = useTagsList(filters);

    const tagsListByFilter = groupBy(tagsList, "filter");
    const tagsListByFilterMerged = Object.values(tagsListByFilter).flat();

    return (
        !isEmpty(tagsList) && (
            <FilterTagsWrapper>
                <FilterTags
                    removeFilter={(tag) => removeFilter(tag, setFilters)}
                    tagsList={tagsListByFilterMerged}
                />
            </FilterTagsWrapper>
        )
    );
};
export default ProjectFilterTags;
