function DebugCode({ title = "DEBUG CODE", data }) {
    return (
        import.meta.env.DEV && (
            <section className="border-dashed border-emergency margin-top-6">
                <h2 className="margin-0">{title}</h2>
                <pre>{JSON.stringify(data, null, 2)}</pre>
            </section>
        )
    );
}

export default DebugCode;
