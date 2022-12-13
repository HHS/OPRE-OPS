import { callBackend, authConfig, backEndConfig } from "../helpers/backend";

class DeployedApplicationContext {
    static helpers() {
        return {
            callBackend,
            authConfig,
            backEndConfig,
        };
    }
}

export default DeployedApplicationContext;
