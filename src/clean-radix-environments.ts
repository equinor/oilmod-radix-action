import { ApiEnvironment } from "./radix-config";
import { state } from "./state";
import { callRadix, log } from './util';

export async function clearOrphans() {
    const { app } = state.options;
    const url = `applications/${app}/environments`;
    try {
        const environments = await callRadix(url).then(r => r.json()) as ApiEnvironment[];
        if (state.options.debug) {
            log(JSON.stringify(environments, null, 2));
        }
        for (let env of environments) {
            if (env.status === 'Orphan') {
                console.log('Deleting radix env: ', env.name);
                await callRadix(`${url}/${env.name}`, {
                    method: 'DELETE'
                });
            }
        }
    } catch (ex) {
        console.error(ex);
    }
    return true;
}
