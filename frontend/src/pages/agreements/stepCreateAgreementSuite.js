import { create, test, enforce, only } from "vest";

const suite = create((data = {}, fieldName) => {
    only(fieldName);

    test("agreement-type", "Contract is required for now.", () => {
        enforce(data["agreement-type"]).equals("CONTRACT");
    });
    test("agreement-title", "This is required information", () => {
        enforce(data["agreement-title"]).isNotBlank();
    });
    test("agreement-description", "This is required information", () => {
        enforce(data["agreement-description"]).isNotBlank();
    });
});

export default suite;
