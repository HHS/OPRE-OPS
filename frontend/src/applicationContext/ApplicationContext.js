import DeployedApplicationContext from "./DeployedApplicationContext";

class ApplicationContext {
    // registerApplicationContext does not currently work when the app is deployed
    // so default to DeployedApplicationContext
    static #applicationContext = DeployedApplicationContext;

    static registerApplicationContext(newApplicationContext) {
        this.#applicationContext = newApplicationContext;
    }

    static get() {
        return this.#applicationContext;
    }
}

export default ApplicationContext;
