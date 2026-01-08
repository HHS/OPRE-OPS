import { describe, it, expect } from "vitest";
import { isFieldDisabled } from "./AgreementEditForm.helpers";
import { AgreementFields } from "../../../pages/agreements/agreements.constants";

describe("AgreementEditForm.helpers", () => {
    describe("isFieldDisabled", () => {
        describe("Super User scenarios", () => {
            it("should return false for super user even when agreement is awarded", () => {
                const immutableFields = ["name", "contract_type"];
                const result = isFieldDisabled(
                    AgreementFields.Name,
                    immutableFields,
                    true, // isSuperUser
                    true // isAgreementAwarded
                );
                expect(result).toBe(false);
            });

            it("should return false for super user with all fields immutable", () => {
                const immutableFields = [
                    "name",
                    "contract_type",
                    "service_requirement_type",
                    "product_service_code_id",
                    "awarding_entity_id",
                    "agreement_reason",
                    "requesting_agency_id",
                    "servicing_agency_id"
                ];
                const result = isFieldDisabled(
                    AgreementFields.ContractType,
                    immutableFields,
                    true,
                    true
                );
                expect(result).toBe(false);
            });

            it("should return false for super user when agreement is not awarded", () => {
                const result = isFieldDisabled(AgreementFields.Name, [], true, false);
                expect(result).toBe(false);
            });
        });

        describe("Non-awarded agreement scenarios", () => {
            it("should return false when agreement is not awarded for regular user", () => {
                const immutableFields = ["name", "contract_type"];
                const result = isFieldDisabled(
                    AgreementFields.Name,
                    immutableFields,
                    false, // isSuperUser
                    false // isAgreementAwarded
                );
                expect(result).toBe(false);
            });

            it("should return false for all fields when agreement is not awarded", () => {
                const immutableFields = ["name"];
                expect(isFieldDisabled(AgreementFields.Name, immutableFields, false, false)).toBe(false);
                expect(isFieldDisabled(AgreementFields.ContractType, immutableFields, false, false)).toBe(false);
                expect(isFieldDisabled(AgreementFields.ServiceRequirementType, immutableFields, false, false)).toBe(
                    false
                );
                expect(isFieldDisabled(AgreementFields.ProductServiceCode, immutableFields, false, false)).toBe(false);
                expect(isFieldDisabled(AgreementFields.ProcurementShop, immutableFields, false, false)).toBe(false);
                expect(isFieldDisabled(AgreementFields.AgreementReason, immutableFields, false, false)).toBe(false);
                expect(isFieldDisabled(AgreementFields.RequestingAgency, immutableFields, false, false)).toBe(false);
                expect(isFieldDisabled(AgreementFields.ServicingAgency, immutableFields, false, false)).toBe(false);
            });
        });

        describe("Awarded agreement scenarios for regular users", () => {
            it("should return true when Name field is in immutableFields for awarded agreement", () => {
                const immutableFields = ["name"];
                const result = isFieldDisabled(
                    AgreementFields.Name,
                    immutableFields,
                    false,
                    true
                );
                expect(result).toBe(true);
            });

            it("should return false when Name field is NOT in immutableFields for awarded agreement", () => {
                const immutableFields = ["contract_type"];
                const result = isFieldDisabled(
                    AgreementFields.Name,
                    immutableFields,
                    false,
                    true
                );
                expect(result).toBe(false);
            });

            it("should return true for ContractType when in immutableFields", () => {
                const immutableFields = ["contract_type"];
                const result = isFieldDisabled(
                    AgreementFields.ContractType,
                    immutableFields,
                    false,
                    true
                );
                expect(result).toBe(true);
            });

            it("should return true for ServiceRequirementType when in immutableFields", () => {
                const immutableFields = ["service_requirement_type"];
                const result = isFieldDisabled(
                    AgreementFields.ServiceRequirementType,
                    immutableFields,
                    false,
                    true
                );
                expect(result).toBe(true);
            });

            it("should return true for ProductServiceCode when in immutableFields", () => {
                const immutableFields = ["product_service_code_id"];
                const result = isFieldDisabled(
                    AgreementFields.ProductServiceCode,
                    immutableFields,
                    false,
                    true
                );
                expect(result).toBe(true);
            });

            it("should return true for ProcurementShop when in immutableFields", () => {
                const immutableFields = ["awarding_entity_id"];
                const result = isFieldDisabled(
                    AgreementFields.ProcurementShop,
                    immutableFields,
                    false,
                    true
                );
                expect(result).toBe(true);
            });

            it("should return true for AgreementReason when in immutableFields", () => {
                const immutableFields = ["agreement_reason"];
                const result = isFieldDisabled(
                    AgreementFields.AgreementReason,
                    immutableFields,
                    false,
                    true
                );
                expect(result).toBe(true);
            });

            it("should return true for RequestingAgency when in immutableFields", () => {
                const immutableFields = ["requesting_agency_id"];
                const result = isFieldDisabled(
                    AgreementFields.RequestingAgency,
                    immutableFields,
                    false,
                    true
                );
                expect(result).toBe(true);
            });

            it("should return true for ServicingAgency when in immutableFields", () => {
                const immutableFields = ["servicing_agency_id"];
                const result = isFieldDisabled(
                    AgreementFields.ServicingAgency,
                    immutableFields,
                    false,
                    true
                );
                expect(result).toBe(true);
            });

            it("should handle multiple fields in immutableFields correctly", () => {
                const immutableFields = ["name", "contract_type", "agreement_reason"];
                expect(isFieldDisabled(AgreementFields.Name, immutableFields, false, true)).toBe(true);
                expect(isFieldDisabled(AgreementFields.ContractType, immutableFields, false, true)).toBe(true);
                expect(isFieldDisabled(AgreementFields.AgreementReason, immutableFields, false, true)).toBe(true);
                expect(isFieldDisabled(AgreementFields.ServiceRequirementType, immutableFields, false, true)).toBe(
                    false
                );
            });
        });

        describe("Unknown or unmapped field scenarios", () => {
            it("should return false for fields not in AWARDED_DISABLED_FIELDS", () => {
                const immutableFields = ["some_random_field"];
                const result = isFieldDisabled(
                    AgreementFields.DescriptionAndNotes, // Not in AWARDED_DISABLED_FIELDS
                    immutableFields,
                    false,
                    true
                );
                expect(result).toBe(false);
            });

            it("should return false for Vendor field even if agreement is awarded", () => {
                const immutableFields = ["vendor"];
                const result = isFieldDisabled(
                    AgreementFields.Vendor,
                    immutableFields,
                    false,
                    true
                );
                expect(result).toBe(false);
            });

            it("should return false for unmapped field with empty immutableFields", () => {
                const result = isFieldDisabled(
                    AgreementFields.NickName,
                    [],
                    false,
                    true
                );
                expect(result).toBe(false);
            });
        });

        describe("Edge cases", () => {
            it("should handle empty immutableFields array", () => {
                const result = isFieldDisabled(
                    AgreementFields.Name,
                    [],
                    false,
                    true
                );
                expect(result).toBe(false);
            });

            it("should use default parameter values correctly", () => {
                // When called with just field and immutableFields
                const immutableFields = ["name"];
                const result = isFieldDisabled(AgreementFields.Name, immutableFields);
                // Should default to isSuperUser=false and isAgreementAwarded=false
                expect(result).toBe(false);
            });

            it("should handle case where field is in immutableFields but agreement is not awarded", () => {
                const immutableFields = ["name"];
                const result = isFieldDisabled(
                    AgreementFields.Name,
                    immutableFields,
                    false,
                    false // Not awarded
                );
                expect(result).toBe(false);
            });

            it("should handle case where super user overrides immutable field", () => {
                const immutableFields = ["name", "contract_type", "agreement_reason"];
                const result = isFieldDisabled(
                    AgreementFields.Name,
                    immutableFields,
                    true, // Super user
                    true
                );
                expect(result).toBe(false);
            });

            it("should return false when immutableFields contains wrong field name", () => {
                const immutableFields = ["wrong_field_name"];
                const result = isFieldDisabled(
                    AgreementFields.Name,
                    immutableFields,
                    false,
                    true
                );
                expect(result).toBe(false);
            });

            it("should be case-sensitive for field names in immutableFields", () => {
                const immutableFields = ["NAME"]; // Wrong case
                const result = isFieldDisabled(
                    AgreementFields.Name,
                    immutableFields,
                    false,
                    true
                );
                expect(result).toBe(false); // Should not match due to case sensitivity
            });
        });

        describe("All disabled fields mapping verification", () => {
            it("should correctly map Name field to 'name'", () => {
                expect(isFieldDisabled(AgreementFields.Name, ["name"], false, true)).toBe(true);
            });

            it("should correctly map ContractType field to 'contract_type'", () => {
                expect(isFieldDisabled(AgreementFields.ContractType, ["contract_type"], false, true)).toBe(true);
            });

            it("should correctly map ServiceRequirementType field to 'service_requirement_type'", () => {
                expect(
                    isFieldDisabled(AgreementFields.ServiceRequirementType, ["service_requirement_type"], false, true)
                ).toBe(true);
            });

            it("should correctly map ProductServiceCode field to 'product_service_code_id'", () => {
                expect(
                    isFieldDisabled(AgreementFields.ProductServiceCode, ["product_service_code_id"], false, true)
                ).toBe(true);
            });

            it("should correctly map ProcurementShop field to 'awarding_entity_id'", () => {
                expect(isFieldDisabled(AgreementFields.ProcurementShop, ["awarding_entity_id"], false, true)).toBe(
                    true
                );
            });

            it("should correctly map AgreementReason field to 'agreement_reason'", () => {
                expect(isFieldDisabled(AgreementFields.AgreementReason, ["agreement_reason"], false, true)).toBe(true);
            });

            it("should correctly map RequestingAgency field to 'requesting_agency_id'", () => {
                expect(isFieldDisabled(AgreementFields.RequestingAgency, ["requesting_agency_id"], false, true)).toBe(
                    true
                );
            });

            it("should correctly map ServicingAgency field to 'servicing_agency_id'", () => {
                expect(isFieldDisabled(AgreementFields.ServicingAgency, ["servicing_agency_id"], false, true)).toBe(
                    true
                );
            });
        });
    });
});
