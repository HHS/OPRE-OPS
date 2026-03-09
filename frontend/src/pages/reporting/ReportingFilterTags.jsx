import FilterTags from "../../components/UI/FilterTags/FilterTags";
import FilterTagsWrapper from "../../components/UI/FilterTags/FilterTagsWrapper";

const ReportingFilterTags = ({ filters, setFilters }) => {
    const tagsList = (filters.portfolios ?? []).map((portfolio) => ({
        tagText: portfolio.name,
        filter: "portfolios"
    }));

    const removeFilter = (tag) => {
        setFilters((prevState) => ({
            ...prevState,
            portfolios: (prevState.portfolios ?? []).filter((portfolio) => portfolio.name !== tag.tagText)
        }));
    };

    if (tagsList.length === 0) {
        return null;
    }

    return (
        <FilterTagsWrapper>
            <FilterTags
                tagsList={tagsList}
                removeFilter={removeFilter}
            />
        </FilterTagsWrapper>
    );
};

export default ReportingFilterTags;
