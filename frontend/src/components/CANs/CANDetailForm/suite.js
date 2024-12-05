import { create, test, enforce, only } from "vest";

const suite = create((data = {}, fieldName) => {
    only(fieldName);

    test("can_nick_name", "This is required information", () => {
        enforce(data.can_nick_name).isNotBlank();
    });

});

export default suite;
