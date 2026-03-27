import { Link } from "react-router-dom";
import { getInternalPath } from "./getInternalPath";

const MarkdownLink = ({ href, children, node, ...props }) => {
    void node;
    const internalPath = getInternalPath(href);

    if (internalPath) {
        return (
            <Link
                to={internalPath}
                {...props}
            >
                {children}
            </Link>
        );
    }

    return (
        <a
            href={href}
            {...props}
        >
            {children}
        </a>
    );
};

export default MarkdownLink;
