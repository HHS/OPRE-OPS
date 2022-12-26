import styles from "./TabsSection.module.css";

const TabsSection = () => {
    return (
        <nav>
            <ul className={styles.tabsList}>
                <li className={styles.listItem}>Budget and Funding</li>
                <li className={styles.listItem}>Research Projects</li>
                <li className={styles.listItem}>People and Teams</li>
            </ul>
        </nav>
    );
};

export default TabsSection;
