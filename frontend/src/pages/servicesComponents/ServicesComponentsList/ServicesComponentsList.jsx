import ServicesComponentListItem from "../ServicesComponentListItem";

function ServicesComponentsList({ servicesComponents, setFormDataById }) {
    return (
        <section className="margin-top-6">
            {servicesComponents.length > 0 ? (
                servicesComponents.map((item, index) => (
                    <ServicesComponentListItem
                        key={index}
                        item={item}
                        setFormDataById={setFormDataById}
                    />
                ))
            ) : (
                <p>You have not added any Services Component yet.</p>
            )}
            {import.meta.env.DEV && (
                <pre className="border-dashed border-emergency ">{JSON.stringify(servicesComponents, null, 2)}</pre>
            )}
        </section>
    );
}

export default ServicesComponentsList;
