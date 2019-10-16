import oauthFetch from "../oauth/oauthFetch.js";
import {getUrl, getDomainName} from "../settings/settingsService.js";
import {getDescriptor} from "../graphs/graphs.service.js";
import defer from "../defer.js";

const params = {
    "api-version":"5.1-preview"
};

const getGraphMember = async({id}) => {
    const descriptor = await getDescriptor(id);

    return await oauthFetch({
        "url": `https://vssps.dev.azure.com/axafrance/_apis/graph/users/${descriptor}`,
        params
    });
};

export const getGraphAvatar = async({id}) => {
    const descriptor = await getDescriptor(id);

    return (await oauthFetch({
        "url": `https://vssps.dev.azure.com/axafrance/_apis/graph/Subjects/${descriptor}/avatars`,
        params
    })).value;
}

const getGraphMemberEmail = async member => (await getGraphMember(member)).mailAddress;

let member = null;
export const getCurrentMember = async() => {
    if (!member) {
        member = defer();
        const currentMember = await oauthFetch({
            "url": `https://vssps.dev.azure.com/${await getDomainName()}/_apis/profile/profiles/me`,
            "params": {
                ...params,
                "details": true
            }
        });
        try {
            currentMember.emailAddress = await getGraphMemberEmail(currentMember);
        } catch {}

        currentMember.teams = await getMemberTeams();
        member.resolve(currentMember);
    }
    return member.promise;
};

const getMemberTeams = async() => (await oauthFetch({
    "url": `${await getUrl()}/teams`,
    "params": {
        ...params,
        "$mine": true
    }
})).value;

export const removeCurrentMember = () => {
    member = null;
}