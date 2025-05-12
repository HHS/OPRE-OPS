import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import Accordion from "../../components/UI/Accordion";
import { data } from "./content/faq";

const FAQ = () => {
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
            <h2 className="margin-bottom-4">Frequently Asked Questions</h2>
            <section className="usa-prose">
                {data.map((item) => (
                    <Accordion
                        key={item.heading}
                        heading={item.heading}
                        level={3}
                        isClosed={true}
                    >
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={components}
                            rehypePlugins={[rehypeRaw]}
                        >
                            {item.content}
                        </ReactMarkdown>
                    </Accordion>
                ))}
            </section>
        </>
    );
};

export default FAQ;
