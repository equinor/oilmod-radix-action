import { state } from "./state";
import { log, radix } from './util';

export async function clearOrphans() {
    const { app } = state.options;
    try {
        const environments = await radix.environment().getEnvironmentSummary(app);
        if (state.options.debug) {
            log(JSON.stringify(environments, null, 2));
        }
        for (let env of environments) {
            if (env.status === 'Orphan') {
                log('Deleting radix env: ' + env.name);
                await radix.environment().deleteEnvironment(app, env.name);
            }
        }
    } catch (ex) {
        console.error(ex);
    }
    return true;
}
