import React from "react";
import Modal from "react-modal";
import customStyles from "./BLIFilterButton.module.css";
import FilterButton from "../../../components/UI/FilterButton/FilterButton";
import FiscalYearComboBox from "../../../components/UI/Form/FiscalYearComboBox";
import PortfoliosComboBox from "../../../components/UI/Form/PortfoliosComboBox";

/**
 * A filter for agreements.
 * @param {Object} props - The component props.
 * @param {Object} props.filters - The current filters.
 * @param {Function} props.setFilters - A function to call to set the filters.
 * @returns {JSX.Element} - The procurement shop select element.
 */
export const BLIFilterButton = ({ setFilters }) => {
    // const currentFY = new Date(getCurrentFiscalYear()).getFullYear();
    const [fiscalYears, setFiscalYears] = React.useState([]);
    const [portfolios, setPortfolios] = React.useState([]);

    // The useEffect() hook calls below are used to set the state appropriately when the filter tags (X) are clicked.
    // useEffect(() => {
    //     setFiscalYears(filters.fiscalYears);
    // }, [filters.fiscalYears]);

    const applyFilter = () => {
        setFilters((prevState) => {
            return {
                ...prevState,
                fiscalYears: fiscalYears,
            };
        });
        setFilters((prevState) => {
            return {
                ...prevState,
                portfolios: portfolios,
            };
        });
    };

    const resetFilter = () => {
        setFilters({
            fiscalYears: [],
            portfolios: [],
        });
        setFiscalYears([]);
        setPortfolios([]);
    };

    const fieldStyles = "usa-fieldset margin-bottom-205";
    const legendStyles = `usa-legend font-sans-3xs margin-top-0 padding-bottom-1 ${customStyles.legendColor}`;

    const fieldsetList = [
        <fieldset key="field1" className={fieldStyles}>
            <FiscalYearComboBox
                selectedFiscalYears={fiscalYears}
                setSelectedFiscalYears={setFiscalYears}
                legendClassname={legendStyles}
                defaultString={"All Fiscal Years"}
                overrideStyles={{ width: "22.7rem" }}
            />
        </fieldset>,
        <fieldset key="field2" className={fieldStyles}>
            <PortfoliosComboBox
                selectedPortfolios={portfolios}
                setSelectedPortfolios={setPortfolios}
                legendClassname={legendStyles}
                defaultString={"All Portfolios"}
                overrideStyles={{ width: "22.7rem" }}
            />
        </fieldset>,
    ];

    Modal.setAppElement("#root");

    return <FilterButton applyFilter={applyFilter} resetFilter={resetFilter} fieldsetList={fieldsetList} />;
};

export default BLIFilterButton;
