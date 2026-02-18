import Modal from "react-modal";
import CANActivePeriodComboBox from "../../../../components/CANs/CANActivePeriodComboBox";
import CanNumberComboBox from "../../../../components/CANs/CanNumberComboBox";
import CANPortfolioComboBox from "../../../../components/CANs/CANPortfolioComboBox";
import CANTransferComboBox from "../../../../components/CANs/CANTransferComboBox";
import FilterButton from "../../../../components/UI/FilterButton";
import useCANFilterButton from "./CANFilterButton.hooks";
import CANFYBudgetRangeSlider from "../../../../components/CANs/CANFYBudgetRangeSlider";

/**
 * @typedef {import('./CANFilterTypes').FilterOption} FilterOption
 */
/**
 * A filter for CANs list.
 * @param {Object} props - The component props.
 * @param {import ('./CANFilterTypes').Filters} props.filters - The current filters.
 * @param {Function} props.setFilters - A function to call to set the filters.
 * @param {FilterOption[]} props.portfolioOptions - The portfolio options.
 * @param {FilterOption[]} props.canOptions - The CAN options.
 * @param {[number, number]} props.fyBudgetRange - The fiscal year budget range.
 * @param {boolean} props.disabled - Whether the button is disabled.
 * @returns {JSX.Element} - The CAN filter button.
 */
export const CANFilterButton = ({ filters, setFilters, portfolioOptions, canOptions, fyBudgetRange, disabled }) => {
    const {
        activePeriod,
        setActivePeriod,
        transfer,
        setTransfer,
        portfolio,
        setPortfolio,
        can,
        setCan,
        budget,
        setBudget,
        applyFilter,
        resetFilter
    } = useCANFilterButton(filters, setFilters, fyBudgetRange);
    const fieldStyles = "usa-fieldset margin-bottom-205";
    const legendStyles = "usa-legend font-sans-3xs margin-top-0 padding-bottom-1 text-base-dark";
    const halfWidth = { width: "12rem" };
    const fullWidth = { width: "22.7rem" };

    const fieldsetList = [
        <div
            key="row-1"
            className="display-flex flex-justify gap-2"
        >
            <fieldset className={fieldStyles + " flex-1"}>
                <CANActivePeriodComboBox
                    activePeriod={activePeriod}
                    setActivePeriod={setActivePeriod}
                    legendClassname={legendStyles}
                    overrideStyles={halfWidth}
                />
            </fieldset>
            <fieldset className={fieldStyles + " flex-1"}>
                <CANTransferComboBox
                    transfer={transfer}
                    setTransfer={setTransfer}
                    legendClassname={legendStyles}
                    overrideStyles={halfWidth}
                />
            </fieldset>
        </div>,
        <fieldset
            key="field-portfolio"
            className={fieldStyles}
        >
            <CANPortfolioComboBox
                portfolio={portfolio}
                setPortfolio={setPortfolio}
                portfolioOptions={portfolioOptions}
                legendClassname={legendStyles}
                overrideStyles={fullWidth}
            />
        </fieldset>,
        <fieldset
            key="field-can"
            className={fieldStyles}
        >
            <CanNumberComboBox
                can={can}
                setCan={setCan}
                canOptions={canOptions}
                legendClassname={legendStyles}
                overrideStyles={fullWidth}
            />
        </fieldset>,
        <fieldset
            key="field-budget"
            className={fieldStyles}
        >
            <CANFYBudgetRangeSlider
                budget={budget}
                setBudget={setBudget}
                legendClassname={legendStyles}
                fyBudgetRange={fyBudgetRange}
            />
        </fieldset>
    ];

    Modal.setAppElement("#root");

    return (
        <FilterButton
            applyFilter={applyFilter}
            resetFilter={resetFilter}
            fieldsetList={fieldsetList}
            disabled={disabled}
        />
    );
};

export default CANFilterButton;
