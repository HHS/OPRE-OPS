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
 * @returns {React.ReactElement} - The rendered component.
 */
export const PortfoliosComboBox = ({
    selectedPortfolios,
    setSelectedPortfolios,
    legendClassname = "usa-label margin-top-0",
    defaultString = "",
    overrideStyles = {},
    portfolioOptions = []
}) => {
    const navigate = useNavigate();
    const { data, error, isSuccess, isLoading } = useGetPortfoliosQuery({});

    const sourcePortfolioOptions = portfolioOptions.length === 0 && isSuccess ? data || [] : portfolioOptions;
    const newPortfolioOptions = sourcePortfolioOptions.map((portfolio) => {
        const portfolioOption = {
            id: portfolio.id,
            title: portfolio.name,
            name: portfolio.name
        };
        return portfolioOption;
    });

    if (isLoading) {
        return <h1>Loading...</h1>;
    }
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
                    />
                </div>
            </div>
        </div>
    );
};

export default PortfoliosComboBox;
