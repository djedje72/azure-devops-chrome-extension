import oauthFetch from "../oauth/oauthFetch.js";
import {getUrl, getDomainName} from "../settings/settingsService.js";

const params = {
    "api-version":"5.1-preview"
};

const getGraphMember = async({id}) => {
    const {value} = await oauthFetch({
        "url": `https://vssps.dev.azure.com/axafrance/_apis/graph/descriptors/${id}`,
        params
    });

    return await oauthFetch({
        "url": `https://vssps.dev.azure.com/axafrance/_apis/graph/users/${value}`,
        params
    });
};

const getGraphMemberEmail = async member => (await getGraphMember(member)).mailAddress;

export const getCurrentMember = async() => {
    const member = await oauthFetch({
        "url": `https://vssps.dev.azure.com/${await getDomainName()}/_apis/profile/profiles/me`,
        "params": {
            ...params,
            "details": true
        }
    });
    try {
        member.emailAddress = await getGraphMemberEmail(member);
    } catch {}

    member.teams = await getMemberTeams();
    return member;
};

const getMemberTeams = async() => (await oauthFetch({
    "url": `${await getUrl()}/teams`,
    "params": {
        ...params,
        "$mine": true
    }
})).value;
