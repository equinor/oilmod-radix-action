import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { radix, delay } from "./util";
import fs from 'fs';
import {promisify} from 'util';
import * as yaml from 'yaml';
import { RadixConfig } from "./radix-config";
import { state } from './state';
import path from "path";
import * as core from '@actions/core';

const readFile = promisify(fs.readFile);

let appName: string;
let env: string;

export async function setSecrets() {
    const {vault, name: environment} = state.options;
    const buf = await readFile(state.environment.RADIX_FILE);
    const yml = buf.toString();
    const radixConfig = yaml.parse(yml, {prettyErrors: true}) as RadixConfig;
    appName = radixConfig.metadata.name;
    env = environment;
    // Build the URL to reach your key vault
    const url = `https://${vault}.vault.azure.net`;

    // Lastly, create our secrets client and connect to the service
    const credential = new DefaultAzureCredential();
    const client = new SecretClient(url, credential);
    for (let c of radixConfig.spec.components) {
        await setSecretsForComponent(c.name, client, c.secrets);
    }
}

async function setSecretsForComponent(component: string, client: SecretClient, secrets: string[] = []) {
    const secretVaultMapping = await readFile(path.join(state.options.context, './secret-map.json'))
        .then(r => r.toString())
        .then(str => JSON.parse(str))
        .then(obj => obj[component]) || {};


    const secretMap = new Map();

    for (let name of secrets) {
        let value: string;
        try {
            value = await loadSecret(secretVaultMapping[name] || name, client);
        } catch (ex) {
            core.warning(`${secretVaultMapping[name] || name} not found in keyvault, setting fallback value. Exception below.`)
            core.warning(ex)
            value = 'FALLBACK_SECRET';
        }
        secretMap.set(name, value);
    }
    for (const k of Array.from(secretMap.keys())) {
        const val = secretMap.get(k);
        await updateRadixSecret(component, k, val)
    }
}

async function updateRadixSecret(component: string, secretName: string, secretValue: string) {
    const res = await radix.environment().changeEnvironmentComponentSecret(appName, env, component, secretName, {secretValue})
    const status = res.status;
    if (status >= 200 && status < 400) {
        return true;
    }
    const error = await res.text();
    console.error(`Failed to update secret ${secretName}: ${error}`);
    return false;
}

async function loadSecret(query: string, client: SecretClient) {
    let value: string;
    try {
        const secret = await client.getSecret(query);
        value = secret.value;
    } catch (ex) {
        core.warning(`Failed to load secret ${query} from az kv: ${ex}`);
        core.warning('Setting fallback secret value = FALLBACK');
        value = 'FALLBACK'
    }
    return value;
}

let attempts = 0;
// Function to ensure we wait until the radix environment is created before proceeding. Default wait is 10 ms.
export async function waitForEnvironment(wait = 10) {
    await delay(wait);
    try {
        await radix.environment().getEnvironment(appName, env);
    } catch {
        if (attempts > 12) {
            throw new Error('Radix environment took more than 120 seconds to create, bailing.')
        } else {
            attempts = attempts + 1;
            return waitForEnvironment(10000);
        }
    }

    return true;
}
