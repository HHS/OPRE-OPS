import Modal from "react-modal";
import CANActivePeriodComboBox from "../../../../components/CANs/CANActivePeriodComboBox";
import CANPortfolioComboBox from "../../../../components/CANs/CANPortfolioComboBox";
import CANTransferComboBox from "../../../../components/CANs/CANTransferComboBox";
import FilterButton from "../../../../components/UI/FilterButton";
import useCANFilterButton from "./CANFilterButton.hooks";
/**
 * @typedef {Object} FilterOption
 * @property {number} id
 * @property {string} title
 */
/**
 * @typedef {Object} Filters
 * @property {FilterOption[]} [activePeriod]
 * @property {FilterOption[]} [transfer]
 * @property {FilterOption[]} [portfolio]
 * // Add other filter types here
 */
/**
 * A filter for CANs list.
 * @param {Object} props - The component props.
 * @param {Filters} props.filters - The current filters.
 * @param {Function} props.setFilters - A function to call to set the filters.
 * @param {FilterOption[]} props.portfolioOptions - The portfolio options.
 * @returns {JSX.Element} - The CAN filter button.
 */
export const CANFilterButton = ({ filters, setFilters, portfolioOptions }) => {
    const { activePeriod, setActivePeriod, transfer, setTransfer, portfolio, setPortfolio, applyFilter, resetFilter } =
        useCANFilterButton(filters, setFilters);
    const fieldStyles = "usa-fieldset margin-bottom-205";
    const legendStyles = "usa-legend font-sans-3xs margin-top-0 padding-bottom-1 text-base-dark";

    const fieldsetList = [
        <fieldset
            key="field-1"
            className={fieldStyles}
        >
            <CANActivePeriodComboBox
                activePeriod={activePeriod}
                setActivePeriod={setActivePeriod}
                legendClassname={legendStyles}
                overrideStyles={{ width: "187px" }}
            />
        </fieldset>,
        <fieldset
            key="field-2"
            className={fieldStyles}
        >
            <CANTransferComboBox
                transfer={transfer}
                setTransfer={setTransfer}
                legendClassname={legendStyles}
                overrideStyles={{ width: "187px" }}
            />
        </fieldset>,
        <fieldset
            key="field-3"
            className={fieldStyles}
        >
            <CANPortfolioComboBox
                portfolio={portfolio}
                setPortfolio={setPortfolio}
                portfolioOptions={portfolioOptions}
                legendClassname={legendStyles}
                overrideStyles={{ width: "187px" }}
            />
        </fieldset>
    ];

    Modal.setAppElement("#root");

    return (
        <FilterButton
            applyFilter={applyFilter}
            resetFilter={resetFilter}
            fieldsetList={fieldsetList}
        />
    );
};

export default CANFilterButton;
