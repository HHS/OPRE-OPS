import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Accordion from "../../components/UI/Accordion";
import { data } from "./content/howToGuides";
import { buildAnchorIds, getAnchorIdFromHash } from "./helpCenterAnchors";

/**
 * How-to Guides component
 * @returns {React.ReactElement} The rendered component
 */
const HowToGuides = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const anchorIds = buildAnchorIds(data);
    const activeAnchorId = getAnchorIdFromHash(location.hash);

    useEffect(() => {
        if (!activeAnchorId) return;

        const targetElement = document.getElementById(activeAnchorId);
        if (targetElement && typeof targetElement.scrollIntoView === "function") {
            targetElement.scrollIntoView({ block: "start" });
        }
    }, [activeAnchorId]);

    const components = {
        table: (props) => (
            <table
                className="usa-table"
                {...props}
            />
        )
    };

    if (!data || data.length === 0) {
        return <div>No data found</div>;
    }

    return (
        <>
            <h2 className="margin-bottom-4">How-to Guides</h2>
            <section className="usa-prose">
                {data.map((item, index) => {
                    const anchorId = anchorIds[index];

                    return (
                        <Accordion
                            key={`${anchorId}-${activeAnchorId}`}
                            id={anchorId}
                            heading={item.heading}
                            level={3}
                            isClosed={activeAnchorId !== anchorId}
                            onToggle={(isOpen) => {
                                if (!isOpen) return;

                                navigate(
                                    {
                                        pathname: location.pathname,
                                        search: location.search,
                                        hash: `#${anchorId}`
                                    },
                                    { replace: true }
                                );
                            }}
                        >
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={components}
                                rehypePlugins={[rehypeRaw]}
                            >
                                {item.content}
                            </ReactMarkdown>
                        </Accordion>
                    );
                })}
            </section>
        </>
    );
};

export default HowToGuides;
