import config from "./oauth.config.js";
import defer from "../defer.js";

const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/token`;

let initFlowDeffered = null;
const initFlow = async() => {
    if (initFlowDeffered) {
        return initFlowDeffered.promise;
    }
    initFlowDeffered = defer();
    const url = `https://app.vssps.visualstudio.com/oauth2/authorize
        ?client_id=${config.clientId}
        &response_type=Assertion
        &state=token
        &scope=${config.scopes.join(" ")}
        &redirect_uri=${redirectUri}`;

    chrome.identity.launchWebAuthFlow({
        url,
        "interactive": true
    }, (url) => {
        if (url) {
            const [,code] = /.+code=([^&].*)/g.exec(url);
            initFlowDeffered.resolve(getAccessToken(code));
        }
    });
    return initFlowDeffered.promise;
};

export default async() => {
    let token = await getToken();
    if (!token || token.Error || !(token.access_token && token.refresh_token)) {
        return await initFlow();
    }

    if (moment(token.expires_date).isBefore(moment())) {
        return await refreshAccessToken();
    }
    return token;
};

const getAccessToken = async (code) => {
    const body = `\
client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer\
&client_assertion=${config.clientSecret}\
&grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer\
&assertion=${code}\
&redirect_uri=${redirectUri}\
`;
    return await retrieveToken(body);
};

let refreshAccessTokenDeferred = null;
const refreshAccessToken = async() => {
    if (refreshAccessTokenDeferred) {
        return refreshAccessTokenDeferred.promise;
    }
    refreshAccessTokenDeferred = defer();

    const {refresh_token} = await getToken();
    const body = `\
client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer\
&client_assertion=${config.clientSecret}\
&grant_type=refresh_token\
&assertion=${refresh_token}\
&redirect_uri=${redirectUri}\
`;
    refreshAccessTokenDeferred.resolve(await retrieveToken(body));
    return refreshAccessTokenDeferred.promise;
};


const getToken = async() => new Promise((resolve) => {
    chrome.storage.local.get("oauthToken", ({oauthToken}) => {
        resolve(oauthToken);
    });
});

const retrieveToken = async(body) => {
    const url = "https://app.vssps.visualstudio.com/oauth2/token";

    const oauthToken = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body
    }).then(e => e.json());
    storeToken(oauthToken);
    return oauthToken;
}

const storeToken = ({access_token, refresh_token, expires_in}) => {
    const oauthToken = {
        access_token,
        refresh_token,
        "expires_date": moment().add(expires_in - 60, "seconds").format()
    }
    chrome.storage.local.set({oauthToken});
};
