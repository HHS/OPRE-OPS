import Tag from "./Tag";
import { NO_DATA } from "../../../constants";

const chunkItems = (items, chunkSize) => {
    const chunks = [];

    for (let index = 0; index < items.length; index += chunkSize) {
        chunks.push(items.slice(index, index + chunkSize));
    }

    return chunks;
};

/**
 * Renders a list of tags in vertical-first columns.
 * @param {Object} props
 * @param {Array<string>} props.items
 * @param {string} [props.dataCy]
 * @param {(item: string) => string} [props.getKey]
 * @param {number} [props.maxRowsPerColumn]
 * @returns {React.ReactElement}
 */
const TagList = ({ items, dataCy, getKey = (item) => item, maxRowsPerColumn = 5 }) => {
    if (!items?.length) {
        return (
            <Tag
                tagStyle="primaryDarkTextLightBackground"
                text={NO_DATA}
                dataCy={dataCy}
            />
        );
    }

    const columns = chunkItems(items, maxRowsPerColumn).slice(0, 2);

    return (
        <div
            data-testid="tag-list-root"
            style={{
                display: "flex",
                flexDirection: "row",
                columnGap: "24px",
                alignItems: "start",
                width: "fit-content"
            }}
        >
            {columns.map((columnItems, columnIndex) => (
                <div
                    key={`column-${columnIndex}`}
                    data-testid="tag-list-column"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        alignItems: "start"
                    }}
                >
                    {columnItems.map((item) => (
                        <Tag
                            key={getKey(item)}
                            tagStyle="primaryDarkTextLightBackground"
                            text={item}
                            dataCy={dataCy}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};

export default TagList;
