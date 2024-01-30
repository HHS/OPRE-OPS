import ServicesComponentListItem from "../ServicesComponentListItem";

function ServicesComponentsList({ servicesComponents, setFormDataById, handleDelete }) {
    return (
        <section className="margin-top-6">
            {servicesComponents.length > 0 ? (
                servicesComponents.map((item, index) => (
                    <ServicesComponentListItem
                        key={index}
                        item={item}
                        setFormDataById={setFormDataById}
                        handleDelete={handleDelete}
                    />
                ))
            ) : (
                <p>You have not added any Services Component yet.</p>
            )}
            {import.meta.env.DEV && (
                <section className="border-dashed border-emergency margin-top-6">
                    <h2 className="margin-0">Services Components</h2>
                    <pre>{JSON.stringify(servicesComponents, null, 2)}</pre>
                </section>
            )}
        </section>
    );
}

export default ServicesComponentsList;
