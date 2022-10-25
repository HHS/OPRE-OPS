import { callBackend, authConfig } from "../helpers/backend";

class DeployedApplicationContext {
    static helpers() {
        return {
            callBackend,
            authConfig,
        };
    }
}

export default DeployedApplicationContext;
