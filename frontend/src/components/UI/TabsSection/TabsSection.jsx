import styles from "./TabsSection.module.scss";

/**
 * Tabs (navigation) section (generic component).
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.links - Array of Link React-Router components.
 * @param {string} props.label - Aria-label for the navigation.
 * @returns {React.JSX.Element} The rendered component.
 */
const TabsSection = ({ links, label }) => {
    return (
        <nav
            className={`margin-bottom-4 padding-left-1 flex-align-center flex-justify-center margin-top-2 position-relative ${styles.tabsList}`}
            aria-label={label}
            role={"navigation"}
        >
            {links}
        </nav>
    );
};

export default TabsSection;
