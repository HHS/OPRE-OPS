import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AgreementEditorContext } from "../../Agreements/AgreementEditor/contexts";
import AllServicesComponentSelect from "./AllServicesComponentSelect";

const pendingDelete = { change_requests_in_review: [{ is_services_component_delete: true }] };
const pendingAdd = { change_requests_in_review: [{ is_services_component_create: true }] };

const renderWithContext = (servicesComponents, value = "") =>
    render(
        <AgreementEditorContext.Provider
            value={{
                agreement: { service_requirement_type: "NON_SEVERABLE" },
                services_components: servicesComponents
            }}
        >
            <AllServicesComponentSelect
                value={value}
                onChange={() => {}}
            />
        </AgreementEditorContext.Provider>
    );

describe("AllServicesComponentSelect", () => {
    it("leaves out an SC whose deletion is in review", () => {
        renderWithContext([
            { id: 1, number: 1, optional: false },
            { id: 2, number: 2, optional: false, ...pendingDelete },
            { id: 3, number: 3, optional: false, ...pendingAdd }
        ]);

        expect(screen.getByRole("option", { name: "SC1" })).toBeInTheDocument();
        expect(screen.queryByRole("option", { name: "SC2" })).not.toBeInTheDocument();
        expect(screen.getByRole("option", { name: "SC3" })).toBeInTheDocument();
    });

    it("keeps the option for a budget line already on an SC whose deletion is in review", () => {
        renderWithContext([{ id: 2, number: 2, optional: false, ...pendingDelete }], 2);

        expect(screen.getByRole("option", { name: "SC2" })).toBeInTheDocument();
    });
});
