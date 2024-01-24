import ServicesComponentSelect from "../ServicesComponentSelect";
import PoPStartDate from "../PoPStartDate";
import PoPEndDate from "../PoPEndDate";

function ServicesComponentForm({ serviceTypeReq, serviceComponent, setServiceComponent }) {
    const nonSeverableOptions = ["SC1", "SC2", "SC3", "SC4", "SC5", "SC6"];
    const severableOptions = [
        "Base Period",
        "Option Period 1",
        "Option Period 2",
        "Option Period 3",
        "Option Period 4",
        "Option Period 5",
        "Option Period 6"
    ];
    const options = serviceTypeReq === "Severable" ? severableOptions : nonSeverableOptions;
    return (
        <div>
            <h2 className="font-sans-lg">Create Services Components</h2>
            <p>
                Create the structure of the agreement using Services Components to describe the work being done. After
                you outline the Services Components, you will add Budget Lines to fund that work.
            </p>
            <div className="display-flex flex-align-center margin-top-3">
                <ServicesComponentSelect
                    onChange={(name, value) => {
                        setServiceComponent({
                            ...serviceComponent,
                            servicesComponent: value
                        });
                    }}
                    value={serviceComponent?.servicesComponent || ""}
                    options={options}
                />
                {serviceTypeReq === "Non-Severable" && (
                    <fieldset className="usa-fieldset margin-left-5">
                        <input
                            className="usa-checkbox__input"
                            id="optional-services-component"
                            type="checkbox"
                            name="optional-services-checkbox"
                            value={serviceComponent?.optional}
                            onChange={() => {
                                setServiceComponent({
                                    ...serviceComponent,
                                    optional: !serviceComponent?.optional
                                });
                            }}
                        />
                        <label
                            className="usa-checkbox__label usa-tool-tip"
                            htmlFor="optional-services-component"
                        >
                            Optional Services Component
                        </label>
                    </fieldset>
                )}
            </div>
            <div className="display-flex flex-align-center margin-top-3">
                <PoPStartDate
                    serviceComponent={serviceComponent}
                    setServiceComponent={setServiceComponent}
                />
                <PoPEndDate
                    serviceComponent={serviceComponent}
                    setServiceComponent={setServiceComponent}
                />
            </div>

            <section className="border-dashed border-green margin-top-6">
                <h2>Form Data</h2>
                <pre>{JSON.stringify(serviceComponent, null, 2)}</pre>
            </section>
        </div>
    );
}

export default ServicesComponentForm;
