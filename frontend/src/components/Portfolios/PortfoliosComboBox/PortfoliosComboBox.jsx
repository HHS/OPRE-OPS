import ComboBox from "../../UI/Form/ComboBox";
import { useGetPortfoliosQuery } from "../../../api/opsAPI";
import { useNavigate } from "react-router-dom";

/**
 *  A comboBox for choosing a Portfolio.
 * @param {Object} props - The component props.
 * @param {import("../../../types/PortfolioTypes").Portfolio[]} props.selectedPortfolios - The currently selected Portfolios.
 * @param {Function} props.setSelectedPortfolios - A function to call when the selected Portfolios change.
 * @param {string} [props.legendClassname] - Additional CSS classes to apply to the label/legend (optional).
 * @param {string} [props.defaultString] - Initial text to display in select (optional).
 * @param {Object} [props.overrideStyles] - Some CSS styles to override the default (optional).
 * @param {import("../../../types/PortfolioTypes").Portfolio[]} [props.portfolioOptions] - An array of portfolio options.
 * @param {boolean} [props.usePrefetchedOptions] - Whether to use provided portfolio options instead of fetching.
 * @returns {React.ReactElement} - The rendered component.
 */
export const PortfoliosComboBox = ({
    selectedPortfolios,
    setSelectedPortfolios,
    legendClassname = "usa-label margin-top-0",
    defaultString = "",
    overrideStyles = {},
    portfolioOptions = null,
    usePrefetchedOptions = false,
    isLoading = false
}) => {
    const navigate = useNavigate();
    const shouldUsePrefetchedOptions = usePrefetchedOptions;
    const {
        data,
        error,
        isSuccess,
        isLoading: isPortfoliosLoading
    } = useGetPortfoliosQuery({}, { skip: shouldUsePrefetchedOptions });

    const sourcePortfolioOptions = shouldUsePrefetchedOptions ? (portfolioOptions ?? []) : isSuccess ? data || [] : [];
    const newPortfolioOptions = sourcePortfolioOptions.map((portfolio) => {
        const portfolioOption = {
            id: portfolio.id,
            title: portfolio.name,
            name: portfolio.name
        };
        return portfolioOption;
    });

    if (error) {
        navigate("/error");
        return;
    }

    return (
        <div className="display-flex flex-justify">
            <div>
                <label
                    className={legendClassname}
                    htmlFor="project-combobox-input"
                >
                    Portfolio
                </label>
                <div>
                    <ComboBox
                        namespace="portfolios-combobox"
                        data={newPortfolioOptions}
                        selectedData={selectedPortfolios}
                        setSelectedData={setSelectedPortfolios}
                        defaultString={defaultString}
                        overrideStyles={overrideStyles}
                        isMulti={true}
                        isLoading={isLoading || (!shouldUsePrefetchedOptions && isPortfoliosLoading)}
                    />
                </div>
            </div>
        </div>
    );
};

export default PortfoliosComboBox;
