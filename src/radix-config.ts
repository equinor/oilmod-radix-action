
export interface Component {
    name: string;
    image: string;
    environmentConfig: EnvironmentConfig[];
    publicPort: string;
    ingressConfiguration: string[];
    alwaysPullImageOnDeploy: boolean;
    ports: Port[];
    secrets: string[];
}

export interface ApiEnvironment {
  name: string;
  status: 'Consistent' | 'Orphan';
  deployments?: any[];
  activeDeployment?: any;
}

export interface Metadata {
    name: string;
}

export interface Environment {
    name: string;
}

export interface Variables {
    [key: string]: string;
}

export interface Requests {
    memory: string;
    cpu: string;
}

export interface Limits {
    memory: string;
    cpu: string;
}

export interface Resources {
    requests: Requests;
    limits: Limits;
}

export interface HorizontalScaling {
    minReplicas: number;
    maxReplicas: number;
}

export interface EnvironmentConfig {
    environment: string;
    imageTagName: string;
    replicas: number;
    variables: Variables;
    monitoring?: boolean;
    resources: Resources;
    horizontalScaling?: HorizontalScaling;
}

export interface Port {
    name: string;
    port: number;
}

export interface DnsExternalAlia {
    alias: string;
    environment: string;
    component: string;
}

export interface DnsAppAlias {
    environment: string;
    component: string;
}

export interface EimsacrprodAzurecrIo {
    username: string;
    email: string;
}

export interface PrivateImageHubs {
    [key: string]: EimsacrprodAzurecrIo;
}

export interface Spec {
    environments: Environment[];
    components: Component[];
    dnsExternalAlias: DnsExternalAlia[];
    dnsAppAlias: DnsAppAlias;
    privateImageHubs: PrivateImageHubs;
}

export interface RadixConfig {
    apiVersion: string;
    kind: string;
    metadata: Metadata;
    spec: Spec;
}

