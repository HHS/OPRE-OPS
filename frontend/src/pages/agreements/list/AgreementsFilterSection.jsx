import "./AgreementsList.scss";
import AgreementsFilterButton from "./AgreementsFilterButton";
import AgreementsFilterTags from "./AgreementsFilterTags";

/**
 * A header section of the agreements page that contains the filters.
 * @param {Object} props - The component props.
 * @param {Object} props.filters - The current filters.
 * @param {Function} props.setFilters - A function to call to set the filters.
 * @returns {JSX.Element} - The procurement shop select element.
 */
export const AgreementsFilterSection = ({ filters, setFilters }) => {
    return (
        <div className="padding-top-05 padding-bottom-05 display-flex" style={{ justifyContent: "space-between" }}>
            <span>
                <AgreementsFilterTags filters={filters} setFilters={setFilters} />
            </span>
            <span>
                <AgreementsFilterButton filters={filters} setFilters={setFilters} />
            </span>
        </div>
    );
};

export default AgreementsFilterSection;
