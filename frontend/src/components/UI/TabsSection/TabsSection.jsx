import styles from "./TabsSection.module.scss";

/**
 * Tabs (navigation) section (generic component).
 * @param {Object} props - The component props.
 * @param {JSX[]} props.links - Array of Link React-Router components.
 * @param {string} props.label - Aria-label for the navigation.
 * @returns {ReactNode} The rendered component.
 */
const TabsSection = ({ links, label }) => {
    return (
        <>
            <nav className={`margin-bottom-4 ${styles.tabsList}`} aria-label={label} role={"navigation"}>
                {links}
            </nav>
        </>
    );
};

export default TabsSection;
