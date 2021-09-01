import fetch from 'node-fetch';
import { state } from './state';

import * as core from '@actions/core';
import * as github from '@actions/github';
import { Radix } from '@ngx-stoui/radix-api';

export async function delay (ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

process.env.API_URL = process.env.API_URL || 'https://api.radix.equinor.com/api/v1';
export const radix = new Radix(state.environment.RADIX_TOKEN);

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
export function log(...message: Array<string>)
export function log(message: string)
export function log(message: Array<string> | string) {
    if (message instanceof Array) {
        message = message.join(' ');
    }
    if (github.context.eventName) {
        core.info(message)
    } else {
        console.log(message);
    }
}
