/**
 * `DebugCode` is a React component that renders a debug code section with a title and data.
 * This component is only rendered in development mode.
 *
 * @component
 * @param {Object} props - The properties passed to the component.
 * @param {string} [props.title="DEBUG CODE"] - The title of the debug section.
 * @param {Object | any[]} props.data - The data to be displayed in the debug section.
 *
 * @returns {JSX.Element | null | boolean } The rendered JSX element, or null if not in development mode.
 *
 * @example
 * <DebugCode title="DEBUG CODE" data={data} />
 */
function DebugCode({ title = "DEBUG CODE", data }) {
    return (
        import.meta.env.DEV && (
            <section className="border-dashed border-accent-cool-darker margin-top-6">
                <div className="display-flex flex-align-center flex-justify padding-x-3 padding-y-2 bg-info-lighter">
                    <h2 className="margin-0">{title}</h2>
                    <button
                        className="usa-button usa-button--outline"
                        onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                            alert("Code copied to clipboard!");
                        }}
                        type="button"
                    >
                        Copy to Clipboard
                    </button>
                </div>
                <div className="padding-2 font-12px">
                    <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            </section>
        )
    );
}

export default DebugCode;
