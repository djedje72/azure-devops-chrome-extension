import basicFetch from "./basic/basicFetch";
import oauthFetch from "./oauth/oauthFetch";
import {removeOAuthToken} from "./oauth/index";
import {removePat} from "./basic/index";

import {getCurrentDomain} from "../settings/settingsService";


export const authFetch = (...args) => {
    const {pat} = getCurrentDomain();
    return pat ? basicFetch(...args) : oauthFetch(...args);
};

export const logout = () => {
    removeOAuthToken();
    removePat();
}