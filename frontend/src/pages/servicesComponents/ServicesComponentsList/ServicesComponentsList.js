import ServicesComponentListItem from "../ServicesComponentListItem";

function ServicesComponentsList({ servicesComponents }) {
    return (
        <>
            <section className="margin-top-6">
                {servicesComponents.length > 0 ? (
                    servicesComponents.map((item, index) => (
                        <ServicesComponentListItem
                            key={index}
                            item={item}
                        />
                    ))
                ) : (
                    <p>You have not added any Services Component yet.</p>
                )}
            </section>
            {import.meta.env.DEV && (
                <pre className="border-dashed border-emergency ">{JSON.stringify(servicesComponents, null, 2)}</pre>
            )}
        </>
    );
}

export default ServicesComponentsList;
