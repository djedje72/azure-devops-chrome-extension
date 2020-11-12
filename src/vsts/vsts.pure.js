import {authFetch} from "../authentication/index";
import {getUrl, getSettings, getDomainUrl, setCurrentDomain, getCurrentDomain} from "settings/settingsService";
import {getCurrentMember, clearAvatarCache} from "../member/memberService.js";
import defer from "../defer.js";

export const initialize = defer();
export const loginInitialize = defer();

export const isInitialize = () => initialize.promise;
export const isLoginInitialize = () => loginInitialize.promise;

const getToApprovePullRequests = async(pullRequests) => {
    let currentMember = await getCurrentMember();
    let toApprovePullRequests = [];
    if(pullRequests.length > 0 && currentMember) {
        toApprovePullRequests = pullRequests.filter((pullRequest) => {
            if(pullRequest.reviewers && pullRequest.createdBy.uniqueName !== currentMember.emailAddress) {
                let teamPullRequest = pullRequest.reviewers.filter((reviewer) => {
                    return currentMember.teams.some(({id}) => id === reviewer.id);
                });
                let mineReview = pullRequest.reviewers.filter((reviewer) => {
                    return reviewer.uniqueName === currentMember.emailAddress;
                });
                const approved = (vote) => vote > 0;
                let approves = mineReview.filter((reviewer) => {
                    return approved(reviewer.vote);
                });
                let denies = mineReview.filter((reviewer) => {
                    return !approved(reviewer.vote);
                });

                if (denies.length > 0 || approves.length === 0 &&  teamPullRequest.length > 0) {
                    return true;
                }
            }
            return false;
        });
    }
    setReminder(toApprovePullRequests);
    return toApprovePullRequests;
};

const getActiveComments = async({url}) => {
    const {value} = await authFetch({
        method: "GET",
        url: `${url}/threads`
    });
    return value.filter(({status, isDeleted}) => !isDeleted && status === "active");
};

const processComments = async(fullPr) => {
    fullPr.comments = await getActiveComments(fullPr);
};

function processPolicies(fullPr) {
    return getPolicyResult(fullPr).then((evaluations) => {
        let state;
        let policies = {};

        if(evaluations.length > 0) {
            let nbApproved = 0;
            evaluations.forEach((evaluation) => {
                if(evaluation.configuration.isEnabled && evaluation.configuration.isBlocking) {
                    if(evaluation.status === "approved" && policies[evaluation.configuration.type.displayName] !== false) {
                        nbApproved++;
                        policies[evaluation.configuration.type.displayName] = true;
                    } else {
                        policies[evaluation.configuration.type.displayName] = false;
                    }
                } else {
                    nbApproved++;
                }
            });

            if(nbApproved === evaluations.length) {
                state = "success";
            } else if (nbApproved === 0) {
                state = "error";
            } else {
                state = "warning";
            }
        } else {
            state = "none";
        }

        fullPr.evaluations = {
            policies: policies,
            state: state
        };
        return Promise.resolve(fullPr);
    });
}

export const getFullPullRequest = async(pr) => {
    const fullPr = await authFetch({
        method: "GET",
        url: pr.url
    });

    try { await processPolicies(fullPr); } catch (e) {}
    try { await processComments(fullPr); } catch (e) {}
    return fullPr;
}

function getPolicyResultByPRId(pr) {
    return getPolicies(pr, "pullRequestId");
}

function getPolicyResultByCRId(pr) {
    return getPolicies(pr, "codeReviewId");
}

async function getPolicies(pr, field) {
    return authFetch({
        method:"GET",
        url: `${await getDomainUrl()}/${pr.repository.project.id}/_apis/policy/evaluations`,
        params: {
            artifactId: "vstfs:///CodeReview/CodeReviewId/" + pr.repository.project.id + "/" + pr[field],
            "api-version":"5.0-preview.1"
        }
    });
}

function getPolicyResult(pr) {
    return getPolicyResultByPRId(pr).then(({value}) => {
        if (value.length === 0) {
            return getPolicyResultByCRId(pr);
        }
        return value;
    });
}

// export const getPullRequests = () => {
//     return getPullRequestsList().then(function(pullRequests) {
//         let promises = [];
//         let fullPullRequests = [];
//         pullRequests.forEach((pr) => {
//             promises.push(getFullPullRequest(pr).then((fullPr) => {
//                 //getVisits(fullPr).then(({newCommentsCount}) => console.log(newCommentsCount));
//                 fullPullRequests.push(fullPr);
//             }));
//         });
//         return Promise.all(promises).then(async() => ({
//             "all": fullPullRequests,
//             "toApprove": await getToApprovePullRequests(fullPullRequests),
//             "mine": await getMinePullRequests(fullPullRequests)
//         }));
//     });
// };

export const getPullRequests = async() => {
    const pullRequests = await getPullRequestsList();
    return {
        "all": pullRequests,
        "toApprove": await getToApprovePullRequests(pullRequests),
        "mine": await getMinePullRequests(pullRequests)
    };
};

export const setCredentials = async({name, pat}) => {
    if(name) {
        setCurrentDomain({
            name,
            pat,
            url: `https://dev.azure.com/${name}/_apis`,
            domainUrl: `https://dev.azure.com/${name}`
        });
        initialize.resolve("init ok");
    } else {
        return Promise.reject("missing arguments");
    }
};

async function getPullRequestsList() {
    const {value} = await authFetch({
        method: "GET",
        url: (await getUrl()) + "/git/pullRequests",
        "params": {
            "$top": 1000
        }
    });
    const {disabledProjects} = getSettings();
    return value
        .filter(({"repository": {project}}) => !(disabledProjects || []).includes(project.id))
        .filter(({creationDate}) => moment(creationDate).isAfter(moment().subtract(3, 'months')));
}

async function getMinePullRequests(prs) {
    let currentMember = await getCurrentMember();
    if(currentMember) {
        return prs.filter(({createdBy}) => createdBy.uniqueName === currentMember.emailAddress);
    }
    return [];
}

function setReminder(toApprovePullRequests) {
    let nbToApprovePullRequests = toApprovePullRequests.length;
    if(nbToApprovePullRequests > 0) {
        browser.browserAction.setBadgeText({text: nbToApprovePullRequests.toString()});
        browser.browserAction.setBadgeBackgroundColor({color: "#FF9999"});
    } else {
        browser.browserAction.setBadgeText({text: ""});
    };
}

export const getProjects = async() => {
    const {value} = await authFetch({
        method: "GET",
        url: (await getUrl()) + "/projects",
        "params": {
            "$top": 1000
        }
    });
    return value;
};

async function getVisits(pr, field) {
    return authFetch({
        method:"POST",
        url: `${await getDomainUrl()}/_apis/visits/artifactStatsBatch`,
        params: {
            "api-version": "5.0-preview.1",
            "includeUpdatesSinceLastVisit": "true"
        },
        data: [
            {
                "discussionArtifactId": `vstfs:///CodeReview/ReviewId/${pr.repository.project.id}%2F${pr["codeReviewId"]}`,
                "artifactId": pr.artifactId.replace("%2f", "%2F")
            }
        ]
    });
}

export const getSuggestionForUser = () => {
    return getAllSuggestions()
        .then(suggestions => suggestions.map(suggestion => fixAzureDevUrls(suggestion)))
        .then(async suggestions => {
            let currentMember = await getCurrentMember();
            let promises = [];
            if(currentMember) {
                suggestions.filter((suggestion) => suggestion.suggestion.length > 0).forEach((suggestion) => {
                    suggestion.suggestion.filter((sug) => sug.type === "pullRequest").forEach((sug) => {
                        let promise = authFetch({
                            method: "GET",
                            url: `${suggestion.repository.url}/commits?branch=${sug.properties.sourceBranch.replace('refs/heads/', '')}&$top=1`
                        }).then(({value}) => {
                            let [lastCommit] = value;
                            if(lastCommit && lastCommit.committer.email === currentMember.emailAddress) {
                                return Object.assign({
                                    remoteUrl: suggestion.repository.remoteUrl,
                                    repositoryId: suggestion.repository.id
                                }, sug);
                            }
                            return null;
                        });
                        promises.push(promise);
                    });
                });
            }
            return Promise.all(promises);
        });
};

async function getRepositories() {
    const {disabledProjects} = getSettings();
    return authFetch({
        method: "GET",
        url: (await getUrl()) + "/git/repositories",
    })
    .then(({value}) => value.filter(({project}) => !(disabledProjects || []).includes(project.id)));
}

// let resetGUID = "00000000-0000-0000-0000-000000000000";
// async function toggleAutoComplete(pr) {
//     let currentMember = await getCurrentMember();
//     if(!currentMember) {
//         return $q.reject("no current member");
//     }
//     return getFullPullRequest(pr).then((refreshPr) => {
//         let data = {
//             "autoCompleteSetBy": {
//                 "id": refreshPr.autoCompleteSetBy !== undefined ? resetGUID : currentMember.id
//             }
//         };
//         return authFetch({
//             "method": "PATCH",
//             "url": pr.url,
//             "params": {
//                 "api-version":"3.0"
//             },
//             "data": data
//         }).catch(
//             (error) => error
//         );
//     });
// }

const fixAzureDevUrls = (item)  => {
    const rp = v => v.replace(/(:\/\/)(.*)@dev.azure.com\//, "$1dev.azure.com/");
    if (item && item.repository) {
        item.repository.remoteUrl = rp(item.repository.remoteUrl);
    }
    return item;
};

function getAllSuggestions() {
    return getRepositories().then((respositories) => {
        let promises = [];
        respositories.forEach((repository) => {
            let promise = authFetch({
                method: "GET",
                url: repository.url + "/suggestions"
            }).then(({value}) => ({
                repository: repository,
                suggestion: value
            }));
            promises.push(promise);
        });
        return Promise.all(promises);
    });
}

export const init = async() => {
    clearAvatarCache();
    const domainToUse = getCurrentDomain();
    if (domainToUse) {
        checkLogin().then(() => {
            initialize.resolve("init ok");
        });
    } else {
        loginInitialize.reject("login missing")
    }
};

async function checkLogin() {
    try {
        await getProjects();
        loginInitialize.resolve("init ok");
    } catch (err) {
        loginInitialize.reject("login failed");
        throw "login failed";
    }
}
