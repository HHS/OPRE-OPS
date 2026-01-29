import { create, test, enforce, only } from "vest";

const suite = create((data = {}, fieldName) => {
    only(fieldName);

    test("users_combobox", "This is required information", () => {
        enforce(data.users_combox).isNotEmpty();
        enforce(data.users_combox?.id).greaterThan(0);
    });
});

export default suite;
