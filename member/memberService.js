import oauthFetch from "../oauth/oauthFetch.js";
import {getUrl, getDomainName} from "../settings/settingsService.js";

export const getCurrentMember = async() => {
    const member = await oauthFetch({
        "url": `https://vssps.dev.azure.com/${await getDomainName()}/_apis/profile/profiles/me`,
        params: {
            "api-version":"5.0",
            "details": true
        }
    });

    member.teams = await getMemberTeams();
    return member;
};

const getMemberTeams = async() => (await oauthFetch({
    "url": `${await getUrl()}/teams`,
    "params": {
        "api-version": "5.0-preview.2",
        "$mine": true
    }
})).value;
