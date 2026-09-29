import React, { useState } from "react";
import FilterButton from "../../components/UI/FilterButton/FilterButton";
import PortfoliosComboBox from "../../components/Portfolios/PortfoliosComboBox";
import { FILTER_MODAL_FULL_WIDTH } from "../../constants";

const ReportingFilterButton = ({ filters, setFilters, portfolioOptions = [] }) => {
    const [showModal, setShowModal] = useState(false);
    const [portfolios, setPortfolios] = React.useState([]);

    // Reseed local buffer from parent filters when the modal opens.
    // Ensures Reset-without-Apply followed by re-opening shows active filters, not cleared state.
    React.useEffect(() => {
        if (showModal) {
            setPortfolios(filters.portfolios ?? []);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showModal]);

    // Sync local buffer when tags are removed externally (X button).
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
        // Clear local buffer only — do NOT call setFilters here.
        // Reset fires no query; the cleared state takes effect when the user clicks Apply.
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
                portfolioOptions={portfolioOptions}
                selectedPortfolios={portfolios}
                setSelectedPortfolios={setPortfolios}
                legendClassname={legendStyles}
                defaultString="All Portfolios"
                overrideStyles={FILTER_MODAL_FULL_WIDTH}
                usePrefetchedOptions={true}
            />
        </fieldset>
    ];

    return (
        <FilterButton
            applyFilter={applyFilter}
            resetFilter={resetFilter}
            fieldsetList={fieldsetList}
            showModal={showModal}
            setShowModal={setShowModal}
        />
    );
};

export default ReportingFilterButton;
