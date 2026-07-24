import Modal from "react-modal";
import FilterComboBox from "../../../components/UI/Form/FilterComboBox";
import FilterButton from "../../../components/UI/FilterButton";
import { FILTER_MODAL_FULL_WIDTH } from "../../../constants";
import useProcurementDashboardFilterButton from "./ProcurementDashboardFilterButton.hooks";

/**
 * @typedef {import('../ProcurementDashboardFilterTypes').Filters} Filters
 * @typedef {import('../ProcurementDashboardFilterTypes').ProcShopOption} ProcShopOption
 * @typedef {import('../../../types/PortfolioTypes').Division} Division
 */

/**
 * A filter for the Procurement Dashboard. Consolidates the Procurement Shop and Division
 * filters into the shared filter modal (Apply/Reset) pattern.
 * @param {Object} props - The component props.
 * @param {Filters} props.filters - The current filters.
 * @param {Function} props.setFilters - A function to call to set the filters.
 * @param {ProcShopOption[]} props.procShopOptions - The procurement shop options.
 * @param {Division[]} props.divisionOptions - The division options.
 * @param {boolean} [props.disabled] - Whether the button is disabled.
 * @returns {JSX.Element} - The Procurement Dashboard filter button.
 */
export const ProcurementDashboardFilterButton = ({
    filters,
    setFilters,
    procShopOptions,
    divisionOptions,
    disabled
}) => {
    const { procShop, setProcShop, division, setDivision, showModal, setShowModal, applyFilter, resetFilter } =
        useProcurementDashboardFilterButton(filters, setFilters);

    const fieldStyles = "usa-fieldset margin-bottom-205";
    const legendStyles = "usa-legend font-sans-3xs margin-top-0 padding-bottom-1 text-base-dark";

    const fieldsetList = [
        <fieldset
            key="field-proc-shop"
            className={fieldStyles}
        >
            <FilterComboBox
                label="Procurement Shop"
                namespace="proc-shop-combobox"
                options={procShopOptions}
                selected={procShop}
                setSelected={setProcShop}
                optionText={(shop) => shop.abbr}
                legendClassname={legendStyles}
                overrideStyles={FILTER_MODAL_FULL_WIDTH}
            />
        </fieldset>,
        <fieldset
            key="field-division"
            className={fieldStyles}
        >
            <FilterComboBox
                label="Division"
                namespace="division-combobox"
                options={divisionOptions}
                selected={division}
                setSelected={setDivision}
                optionText={(division) => division.name}
                legendClassname={legendStyles}
                overrideStyles={FILTER_MODAL_FULL_WIDTH}
            />
        </fieldset>
    ];

    Modal.setAppElement("#root");

    return (
        <FilterButton
            applyFilter={applyFilter}
            resetFilter={resetFilter}
            fieldsetList={fieldsetList}
            showModal={showModal}
            setShowModal={setShowModal}
            disabled={disabled}
        />
    );
};

export default ProcurementDashboardFilterButton;
