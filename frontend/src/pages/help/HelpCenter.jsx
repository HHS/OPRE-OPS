import { useEffect } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import App from "../../App";
import PageHeader from "../../components/UI/PageHeader";
import Tabs from "../../components/UI/Tabs";
import { HELP_CENTER_EXPORT_URL } from "../../constants";
import icons from "../../uswds/img/sprite.svg";
import FAQ from "./FAQ";
import Feedback from "./Feedback";
import Glossary from "./Glossary";
import HowToGuides from "./HowToGuides";

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
                            className="usa-link display-flex flex-align-center"
                            href={HELP_CENTER_EXPORT_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <span>Open in SharePoint</span>
                            <svg
                                className="margin-left-05"
                                aria-hidden="true"
                                style={{ fill: "#005EA2", height: "20px", width: "20px" }}
                            >
                                <use href={`${icons}#launch`}></use>
                            </svg>
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

export default HelpCenter;
