import TabsSection from "../../../../components/UI/TabsSection";

/**
 * PortfolioTabs component - displays tabs for All Portfolios and My Portfolios
 * @component
 * @param {Object} props
 * @param {string} props.activeTab - The currently active tab ("all" or "my")
 * @param {Function} props.setActiveTab - Function to set the active tab
 * @returns {JSX.Element} - The rendered component
 */
const PortfolioTabs = ({ activeTab, setActiveTab }) => {
    const selected = "font-sans-2xs text-bold text-base-darkest border-bottom-2px border-primary padding-x-105 padding-y-1";
    const notSelected = "font-sans-2xs text-bold text-base padding-x-105 padding-y-1 cursor-pointer hover:text-primary";

    const tabs = [
        {
            id: "all",
            label: "All Portfolios"
        },
        {
            id: "my",
            label: "My Portfolios"
        }
    ];

    const links = tabs.map((tab) => {
        return (
            <button
                key={tab.id}
                className={activeTab === tab.id ? selected : notSelected}
                onClick={() => setActiveTab(tab.id)}
                data-cy={activeTab === tab.id ? "tab-selected" : "tab-not-selected"}
                type="button"
            >
                {tab.label}
            </button>
        );
    });

    return (
        <TabsSection
            links={links}
            label="Portfolio Tabs Section"
        />
    );
};

export default PortfolioTabs;
