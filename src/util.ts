import fetch from 'node-fetch';
import { state } from './state';

export async function delay (ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function callRadix(path: string, config: Partial<RequestInit> = {}) {
    const url = `${state.environment.RADIX_API}/${path}`;
    return fetch(url, {
        ...config,
        headers: {
            ...(config.headers || {}),
            Authorization: `Bearer ${state.environment.RADIX_TOKEN}`
        },
    } as any);
}
