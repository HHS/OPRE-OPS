import { useEffect } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import App from "../../App";
import PageHeader from "../../components/UI/PageHeader";
import Tabs from "../../components/UI/Tabs";
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
            <section className="display-flex flex-justify margin-top-3">
                <HelpTabs />
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

const HelpTabs = () => {
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

    return <Tabs paths={paths} />;
};

export default HelpCenter;
