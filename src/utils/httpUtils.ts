import axios, { AxiosRequestConfig, AxiosPromise } from "axios";
import { omit } from "lodash";
import { globalState } from "../globalState";
import { DialogType, promptForOpenOutputChannel } from "./uiUtils";
import { getWorkspaceConfiguration } from "./settingUtils";

function getProxyConfig(): AxiosRequestConfig | undefined {
    const config = getWorkspaceConfiguration();
    const enableProxy = config.get<boolean>("proxy.enable");
    if (!enableProxy) {
        return undefined;
    }
    const host = config.get<string>("proxy.host");
    const port = config.get<number>("proxy.port");
    const protocol = config.get<string>("proxy.protocol");

    if (!host || !port || !protocol) {
        return undefined;
    }

    return {
        proxy: {
            host,
            port,
            protocol
        }
    };
}

const referer = "vscode-lc-extension";

export function LcAxios<T = any>(path: string, settings?: AxiosRequestConfig): AxiosPromise<T> {
    const cookie = globalState.getCookie();
    if (!cookie) {
        promptForOpenOutputChannel(
            `Failed to obtain the cookie. Please log in again.`,
            DialogType.error
        );
        return Promise.reject("Failed to obtain the cookie.");
    }
    const proxyConfig = getProxyConfig();
    return axios(path, {
        ...proxyConfig,
        headers: {
            referer,
            "content-type": "application/json",
            cookie,
            ...(settings && settings.headers),
        },
        xsrfCookieName: "csrftoken",
        xsrfHeaderName: "X-CSRFToken",
        ...(settings && omit(settings, "headers")),
    });
}
