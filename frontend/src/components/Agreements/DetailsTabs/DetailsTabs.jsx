import styles from "./DetailsTabs.module.scss";
import { Link, useLocation } from "react-router-dom";

const DetailsTabs = ({ agreementId }) => {
    const location = useLocation();

    const selected = `font-sans-2xs text-bold ${styles.listItemSelected}`;

    const notSelected = `font-sans-2xs text-bold ${styles.listItemNotSelected}`;

    const paths = [
        {
            name: "",
            editorName: "/details/edit",
            label: "Agreement Details",
        },
        {
            name: "/budget-lines",
            editorName: "/budget-lines/edit",
            label: "Budget Lines",
        },
    ];

    const links = paths.map((path) => {
        const pathName = `/agreements/${agreementId}${path.name}`;
        const editorPathName = `/agreements/${agreementId}${path.editorName}`;
        const tabSelected = [pathName, editorPathName].includes(location.pathname);
        console.log("location.pathname:", location.pathname);
        console.log(pathName, (location.pathname === pathName));
        console.log(editorPathName, (location.pathname === editorPathName));
        console.log(location.pathname in [pathName, editorPathName]);

        return (
            <Link to={pathName} className={tabSelected ? selected : notSelected} key={pathName}>
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
