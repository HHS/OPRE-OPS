import styles from "./TabsSection.module.scss";

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
