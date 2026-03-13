import React from "react";
import FilterButton from "../../components/UI/FilterButton/FilterButton";
import PortfoliosComboBox from "../../components/Portfolios/PortfoliosComboBox";
import { FILTER_MODAL_FULL_WIDTH } from "../../constants";

const ReportingFilterButton = ({ filters, setFilters }) => {
    const [portfolios, setPortfolios] = React.useState([]);

    React.useEffect(() => {
        setPortfolios(filters.portfolios ?? []);
    }, [filters.portfolios]);

    const applyFilter = () => {
        setFilters((prevState) => ({
            ...prevState,
            portfolios: portfolios
        }));
    };

    const resetFilter = () => {
        setFilters({ portfolios: [] });
        setPortfolios([]);
    };

    const fieldStyles = "usa-fieldset margin-bottom-205";
    const legendStyles = "usa-legend font-sans-3xs margin-top-0 padding-bottom-1";

    const fieldsetList = [
        <fieldset
            key="portfolio-field"
            className={fieldStyles}
        >
            <PortfoliosComboBox
                selectedPortfolios={portfolios}
                setSelectedPortfolios={setPortfolios}
                legendClassname={legendStyles}
                defaultString="All Portfolios"
                overrideStyles={FILTER_MODAL_FULL_WIDTH}
            />
        </fieldset>
    ];

    return (
        <FilterButton
            applyFilter={applyFilter}
            resetFilter={resetFilter}
            fieldsetList={fieldsetList}
        />
    );
};

export default ReportingFilterButton;
