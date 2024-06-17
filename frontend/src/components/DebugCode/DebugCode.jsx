import PropTypes from "prop-types";

/**
 * `DebugCode` is a React component that renders a debug code section with a title and data.
 * This component is only rendered in development mode.
 *
 * @component
 * @param {Object} props - The properties passed to the component.
 * @param {string} [props.title="DEBUG CODE"] - The title of the debug section.
 * @param {Object | []} props.data - The data to be displayed in the debug section.
 *
 * @returns {JSX.Element | null | boolean } The rendered JSX element, or null if not in development mode.
 *
 * @example
 * <DebugCode title="DEBUG CODE" data={data} />
 */
function DebugCode({ title = "DEBUG CODE", data }) {
    return (
        import.meta.env.DEV && (
            <section
                className="border-dashed border-emergency margin-top-6"
                id={title}
            >
                <h2 className="margin-0">{title}</h2>
                <pre>{JSON.stringify(data, null, 2)}</pre>
            </section>
        )
    );
}

DebugCode.propTypes = {
    title: PropTypes.string,
    data: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired
};
export default DebugCode;
