import FilterTags from "../../components/UI/FilterTags/FilterTags";
import FilterTagsWrapper from "../../components/UI/FilterTags/FilterTagsWrapper";

const ReportingFilterTags = ({ filters, setFilters }) => {
    const tagsList = (filters.portfolios ?? []).map((portfolio) => ({
        tagText: portfolio.name,
        filter: "portfolios",
        id: portfolio.id
    }));

    const removeFilter = (tag) => {
        setFilters((prevState) => ({
            ...prevState,
            portfolios: (prevState.portfolios ?? []).filter((portfolio) => portfolio.id !== tag.id)
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
