import ServicesComponentListItem from "../ServicesComponentListItem";
import DebugCode from "../DebugCode";

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
            <DebugCode
                title="Services Components"
                data={servicesComponents}
            />
        </section>
    );
}

export default ServicesComponentsList;
