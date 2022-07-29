import { callBackend } from "../helpers/backend";

class DeployedApplicationContext {
    static helpers() {
        return {
            callBackend,
        };
    }
}

export default DeployedApplicationContext;
