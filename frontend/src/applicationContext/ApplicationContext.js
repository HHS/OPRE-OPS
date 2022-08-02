class ApplicationContext {
    static #applicationContext;

    static registerApplicationContext(newApplicationContext) {
        this.#applicationContext = newApplicationContext;
    }

    static get() {
        return this.#applicationContext;
    }
}

export default ApplicationContext;
