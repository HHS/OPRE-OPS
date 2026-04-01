import { useEffect } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import App from "../../App";
import PageHeader from "../../components/UI/PageHeader";
import Tabs from "../../components/UI/Tabs";
import icons from "../../uswds/img/sprite.svg";
import FAQ from "./FAQ";
import Feedback from "./Feedback";
import Glossary from "./Glossary";
import HowToGuides from "./HowToGuides";

const HELP_CENTER_EXPORT_URL =
    "https://hhsgov.sharepoint.com/:f:/s/OPREPortfoliomanagementSystemOCIO/IgAh8IKPYZVUSbtEG09m-yqrASNaVBLF-INQxBpoSOVdwtI?e=Qi7bj3";

const HelpCenter = () => {
    // Remove trailing slash to default Help Center to auto select How-to Guides
    const navigate = useNavigate();
    useEffect(() => {
        const currentPath = window.location.pathname;
        if (currentPath.endsWith("/")) {
            navigate(currentPath.slice(0, -1), { replace: true });
        }
    }, [navigate]);

    return (
        <App breadCrumbName="Help Center">
            <PageHeader
                title="Help Center"
                subTitle="OPS Guides & Information"
            />
            <p className="font-sans-md line-height-sans-5 margin-top-0 margin-bottom-6">
                Welcome to the Help Center - your go-to resource for assisting you in OPS. Whether you&apos;re just
                getting started or looking to deepen your expertise or learn something new, check out the tabs below.
            </p>
            <section className="margin-top-3">
                <HelpTabs
                    rightContent={
                        <a
                            className="usa-link text-bold display-flex flex-align-center"
                            href={HELP_CENTER_EXPORT_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <svg
                                className="height-2 width-2 margin-right-05"
                                aria-hidden="true"
                                style={{ fill: "#005EA2", height: "24px", width: "24px" }}
                            >
                                <use href={`${icons}#save_alt`}></use>
                            </svg>
                            <span>Export</span>
                        </a>
                    }
                />
            </section>
            <Routes>
                <Route
                    path=""
                    element={<HowToGuides />}
                />
                <Route
                    path="faq"
                    element={<FAQ />}
                />
                <Route
                    path="glossary"
                    element={<Glossary />}
                />
                <Route
                    path="feedback"
                    element={<Feedback />}
                />
            </Routes>
        </App>
    );
};

const HelpTabs = ({ rightContent }) => {
    const paths = [
        {
            label: "How-to Guides",
            pathName: "/help-center"
        },
        {
            label: "Frequently Asked Questions",
            pathName: "/help-center/faq"
        },
        {
            label: "Glossary",
            pathName: "/help-center/glossary"
        },
        {
            label: "Share Feedback",
            pathName: "/help-center/feedback"
        }
    ];

    return (
        <Tabs
            paths={paths}
            rightContent={rightContent}
        />
    );
};

export { HELP_CENTER_EXPORT_URL };
export default HelpCenter;
