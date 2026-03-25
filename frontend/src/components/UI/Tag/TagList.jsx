import Tag from "./Tag";
import { NO_DATA } from "../../../constants";

const chunkItems = (items, chunkSize) => {
    const chunks = [];

    for (let index = 0; index < items.length; index += chunkSize) {
        chunks.push(items.slice(index, index + chunkSize));
    }

    return chunks;
};

const splitAlternatingIntoTwoColumns = (items) => {
    const leftColumn = [];
    const rightColumn = [];

    items.forEach((item, index) => {
        if (index % 2 === 0) {
            leftColumn.push(item);
        } else {
            rightColumn.push(item);
        }
    });

    return [leftColumn, rightColumn].filter((column) => column.length > 0);
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

    const columns =
        items.length > maxRowsPerColumn * 2
            ? splitAlternatingIntoTwoColumns(items)
            : chunkItems(items, maxRowsPerColumn);

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
