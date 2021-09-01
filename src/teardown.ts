import * as yaml from 'yaml';
import { RadixConfig, Component, Variables } from './radix-config';
import fs from 'fs';
import { promisify } from 'util';
import { radix } from './util';
import { DefaultAzureCredential } from "@azure/identity";
import { ContainerRegistryClient, TagProperties } from "@azure/container-registry";
import { state } from './state';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);


export async function teardownEnvironment() {
    const {name: env} = state.options;
    const kubeEnvironmentRegex = /^[a-z0-9]([-a-z0-9]*[a-z0-9])$/;
    const envIsValid = kubeEnvironmentRegex.test(env);
    if (!envIsValid) {
        throw new Error(`Invalid environment name: ${env} (must match pattern ${kubeEnvironmentRegex.source})`);
    }
    const buf = await readFile(state.environment.RADIX_FILE);
    const d = buf.toString();
    const obj = yaml.parse(d) as RadixConfig;

    obj.spec.environments = obj.spec.environments.filter(e => e.name !== env);
    obj.spec.components = obj.spec.components.map(comp => {
        const environmentConfig = comp.environmentConfig.filter(e => e.environment !== env);
        return {...comp, environmentConfig};
    });
    try {
        await deleteImageTags(env);
    } catch {}

    // Wont work - radix requires removing in .yml first.
    // await teardownInRadix(env, appName);

    await updateConfig(obj);
}

async function deleteImageTags(env: string) {
    if (!state.options.registry) {
        return;
    }
    const endpoint = `https://${state.options.registry}`;
    // Create a ContainerRegistryClient that will authenticate through Active Directory
    const client = new ContainerRegistryClient(endpoint, new DefaultAzureCredential());
  
    const iterator = client.listRepositories();
    for await (const repository of iterator) {
        const repoClient = client.getRepositoryClient(repository);
        let props: TagProperties;
        try {
            props = await repoClient.getTagProperties(env);
        } catch {}
        if (props && props.writeableProperties.canDelete) {
            await repoClient.deleteTag(env);
            console.log(`Deleted ${props.repository}/${props.name}`);
        }

    }
  }
  

async function teardownInRadix(env: string, appName: string) {
    const status = await radix.environment().deleteEnvironment(appName, env)
      .then(r => r.status);
    console.log(status);
}

async function updateConfig(obj: RadixConfig) {
    const doc = new yaml.Document()
    doc.setSchema()
    doc.contents = doc.schema.createNode(obj)
    const toYaml = String(doc);
    await writeFile(state.environment.RADIX_FILE, toYaml, 'utf8');
}
