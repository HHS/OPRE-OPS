import styles from "./DetailsTabs.module.scss";
import { Link, useLocation } from "react-router-dom";

const DetailsTabs = ({ agreementId }) => {
    const location = useLocation();

    const selected = `font-sans-2xs text-bold ${styles.listItemSelected}`;

    const notSelected = `font-sans-2xs text-bold ${styles.listItemNotSelected}`;

    const paths = [
        {
            name: "",
            label: "Agreement Details",
        },
        {
            name: "/budget-lines",
            label: "Budget Lines",
        }
    ];

    const links = paths.map((path) => {
        const pathName = `/agreements/${agreementId}${path.name}`;

        return (
            <Link to={pathName} className={location.pathname === pathName ? selected : notSelected} key={pathName}>
                {path.label}
            </Link>
        );
    });

    return (
        <>
            <nav
                className={`margin-bottom-4 ${styles.tabsList}`}
                aria-label={"Agreement Tab Sections"}
                role={"navigation"}
            >
                {links}
            </nav>
        </>
    );
};

export default DetailsTabs;
