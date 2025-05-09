import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { data } from "./content/glossary";

if (!data || data.length === 0) {
    throw new Error("Glossary data is required");
}

/**
 * Table of Contents component
 * @param {Object} props - The component props
 * @param {Array<{heading: string, content: string}>} props.data - The data to display in the table of contents
 * @returns {React.ReactElement} The rendered component
 */
const TableOfContents = ({ data }) => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ%".split("");
    const existingLetters = new Set(data.map((item) => item.heading[0].toUpperCase()));

    return (
        <div className="display-flex flex-wrap margin-bottom-4 flex-justify-center">
            {alphabet.map((letter) => (
                <div
                    key={letter}
                    className="margin-right-3 margin-bottom-1"
                >
                    {existingLetters.has(letter) ? (
                        <a
                            href={`#section-${letter}`}
                            className="text-primary"
                        >
                            {letter}
                        </a>
                    ) : (
                        <span className="text-gray-30">{letter}</span>
                    )}
                </div>
            ))}
        </div>
    );
};

/**
 * Glossary component
 * @returns {React.ReactElement} The rendered component
 */
const Glossary = () => {
    // Sort data alphabetically, but put items starting with % at the end
    const sortedData = [...data].sort((a, b) => {
        const aStartsWithPercent = a.heading.startsWith("%");
        const bStartsWithPercent = b.heading.startsWith("%");

        if (aStartsWithPercent && !bStartsWithPercent) return 1;
        if (!aStartsWithPercent && bStartsWithPercent) return -1;
        return a.heading.localeCompare(b.heading);
    });

    let currentLetter = "";

    return (
        <>
            <h2 className="margin-bottom-4">Glossary</h2>
            <TableOfContents data={sortedData} />
            <section className="usa-prose">
                {sortedData.map((item) => {
                    const firstLetter = item.heading[0].toUpperCase();
                    let letterHeader = null;
                    if (firstLetter !== currentLetter) {
                        currentLetter = firstLetter;
                        letterHeader = (
                            <h3
                                id={`section-${firstLetter}`}
                                className="margin-top-4 margin-bottom-2"
                            >
                                {firstLetter}
                            </h3>
                        );
                    }

                    return (
                        <section key={item.heading}>
                            {letterHeader}
                            <dl>
                                <dt className="text-primary text-bold">{item.heading}</dt>
                                <dd className="margin-left-0 line-height-body-3 margin-top-05 margin-bottom-3">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[rehypeRaw]}
                                    >
                                        {item.content}
                                    </ReactMarkdown>
                                </dd>
                            </dl>
                        </section>
                    );
                })}
            </section>
        </>
    );
};

export default Glossary;
