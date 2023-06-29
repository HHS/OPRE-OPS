import { create, test, enforce, only } from "vest";

const suite = create((data = {}, fieldName) => {
    only(fieldName); // only run the tests for the field that changed
    console.log(`data: ${JSON.stringify(data, null, 2)}`);
    test("agreement_type", "Contract is required for now.", () => {
        enforce(data.agreement_type).equals("CONTRACT");
    });
    test("name", "This is required information", () => {
        enforce(data.name).isNotBlank();
    });
    test("description", "This is required information", () => {
        enforce(data.description).isNotBlank();
    });
    test("product_service_code_id", "This is required information", () => {
        enforce(data.product_service_code_id).isNotBlank();
    });
    test("product_service_code_id", "This is required information", () => {
        enforce(data.product_service_code_id).notEquals("0");
    });
});

export default suite;
