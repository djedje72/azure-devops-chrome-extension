(function() {
    angular.module('vstsChrome').service("vstsService", VstsService);

    VstsService.$inject=['$http', '$q', 'memberService', 'settingsService'];
    function VstsService($http, $q, memberService, settingsService) {
        let resetGUID = "00000000-0000-0000-0000-000000000000";
        
        let initialize = $q.defer();
        const loginInitialize = $q.defer();
        let domainToUse = settingsService.getCurrentDomain();
        if (domainToUse) {
            $http.defaults.headers.common.Authorization = "Basic " + domainToUse.basic;
            //initialize.resolve("init ok");
            checkLogin().then(() => {
                initialize.resolve("init ok");
            });
        } else {
            loginInitialize.reject("login missing");
            domainToUse = {};
        }

        function checkLogin() {
            return $http({
                method: "GET",
                responseType: "json",
                url: domainToUse.vstsUrl + "/projects"
            }).then((response) => {
                if (response.data) {
                    loginInitialize.resolve("init ok");
                } else {
                    loginInitialize.reject("login failed");
                    return $q.reject("login failed");
                }
            }, () => {
                loginInitialize.reject("login failed");
                return $q.reject("login failed");
            });
        }
    
        let mainProject;

        function getToApprovePullRequests(pullRequests) {
            let currentMember = memberService.getCurrentMember();
            if(pullRequests.length > 0 && currentMember) {
                let toApprovePullRequests = pullRequests.filter(function(pullRequest) {
                    if(pullRequest.reviewers && pullRequest.createdBy.uniqueName !== currentMember.uniqueName) {
                        let teamPullRequest = pullRequest.reviewers.filter((reviewer) => {
                            return currentMember.teams.includes(reviewer.id);
                        });
                        let mineReview = pullRequest.reviewers.filter((reviewer) => {
                            return reviewer.uniqueName === currentMember.uniqueName;
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
                setReminder(toApprovePullRequests);
                return toApprovePullRequests;
            }
        }

        function getMinePullRequests() {
            let currentMember = memberService.getCurrentMember();
            if(currentMember) {
                return $http({
                    method: "GET",
                    url: `${domainToUse.vstsUrl}/git/pullRequests?creatorId=${currentMember.id}`
                }).then(
                    (httpPullRequests) => httpPullRequests.data.value
                ).then((minePullRequests) => $q.all(minePullRequests.map((minePullRequest) => getFullPullRequest(minePullRequest))));
            }
            return $q.resolve([]);
        }

        function setReminder(toApprovePullRequests) {
            let nbToApprovePullRequests = toApprovePullRequests.length;
            if(nbToApprovePullRequests > 0) {
                chrome.browserAction.setBadgeText({text: nbToApprovePullRequests.toString()});
                chrome.browserAction.setBadgeBackgroundColor({color: "#FF9999"});
            } else {
                chrome.browserAction.setBadgeText({text: ""});
            };
        }

        function processPolicies(fullPr) {
            return getPolicyResult(fullPr).then((evaluations) => {
                let state;
                let policies = {};

                if(evaluations.length > 0) {
                    let nbApproved = 0;
                    let successEval = evaluations.forEach((eval) => {
                        if(eval.configuration.isEnabled && eval.configuration.isBlocking) {
                            if(eval.status === "approved" && policies[eval.configuration.type.displayName] !== false) {
                                nbApproved++;
                                policies[eval.configuration.type.displayName] = true;
                            } else {
                                policies[eval.configuration.type.displayName] = false;
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
                return $q.resolve(fullPr);
            });
        }

        function getFullPullRequest(pr) {
            return $http({
                method: "GET",
                url: pr.url
            }).then(function(httpPullRequest) {
                let fullPr = httpPullRequest.data;
                //Async
                processPolicies(fullPr);

                return fullPr;
            });
        }

        function getPolicyResultByPRId(pr) {
            return getPolicies(pr, "pullRequestId");
        }

        function getPolicyResultByCRId(pr) {
            return getPolicies(pr, "codeReviewId");
        }

        function getPolicies(pr, field) {
            return $http({
                method:"GET",
                url: domainToUse.domainUrl + "/" + pr.repository.project.id + "/_apis/policy/Evaluations",
                params: {
                    artifactId: "vstfs:///CodeReview/CodeReviewId/" + pr.repository.project.id + "/" + pr[field]
                }
            }).then(({data}) => data.value);
        }

        function getVisits(pr, field) {
            return $http({
                method:"POST",
                url: `${domainToUse.domainUrl}/_apis/visits/artifactStatsBatch`,
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
            }).then(({data}) => data.value); 
        }

        function getPolicyResult(pr) {
            return getPolicyResultByPRId(pr).then((value) => {
                if (value.length === 0) {
                    return getPolicyResultByCRId(pr);
                }
                return value;
            });
        }

        function getPullRequests() {
            return getPullRequestsList().then(function(pullRequests) {
                let promises = [];
                let fullPullRequests = [];
                pullRequests.forEach((pr) => {
                    promises.push(getFullPullRequest(pr).then((fullPr) => {
                        //getVisits(fullPr).then(({newCommentsCount}) => console.log(newCommentsCount));
                        fullPullRequests.push(fullPr);
                    }));
                });
                return $q.all(promises).then(() => 
                    getMinePullRequests().then((minePullRequests) => ({
                        "all": fullPullRequests,
                        "toApprove": getToApprovePullRequests(fullPullRequests),
                        "mine": minePullRequests
                    }))
                );
            });
        }

        function getPullRequestsList() {
            let allPullRequests = [];
            let promises = [];
            return $http({
                method: "GET",
                url: domainToUse.vstsUrl + "/git/pullRequests"
            }).then((httpPullRequests) => httpPullRequests.data.value);
        }

        function getAllProjects() {
            return $http({
                method: "GET",
                url: domainToUse.vstsUrl + "/projects"
            }).then((httpProjects) => {
                let projects = httpProjects.data.value;
                let promises = [];
                let fullProjects = [];
                projects.forEach(function(project) {
                    let promise = $http({
                        method: "GET",
                        url: project.url
                    }).then((fullProject) => fullProjects.push(fullProject.data));
                    promises.push(promise);
                });
                return $q.all(promises).then(() => fullProjects);
            });
        }

        const getTeamMembers = async() => {
            let membersResult = new Map();

            const {"value": teams, ...t} = await $http({
                method: "GET",
                url: `${domainToUse.vstsUrl}/teams`
            }).then(({data}) => data);

            await Promise.all(teams.flatMap(async({url, id}) => {
                const {"value": members} = await $http({
                    method: "GET",
                    url: `${url}/members`
                }).then(({data}) => data);
                members.forEach(({identity}) => {
                    if(!membersResult.has(identity.id)) {
                        identity.teams = [id];
                        membersResult.set(identity.id, identity);
                    } else {
                        tmpMember = membersResult.get(identity.id);
                        tmpMember.teams.push(id);
                    }
                });
            }));

            return [...membersResult.values()];
        };

        // function getTeamMembers() {
        //     return getAllProjects().then((projects) => {
        //         let promises = [];
        //         let members = new Map();
        //         projects.forEach((project) => {
        //             let promise = $http({
        //                 method: "GET",
        //                 url: project.defaultTeam.url + "/members"
        //             }).then(function(httpMembers) {
        //                 httpMembers.data.value.forEach(({identity}) => {
        //                     if(!members.has(identity.id)) {
        //                         identity.teams = [project.defaultTeam.id];
        //                         members.set(identity.id, identity);
        //                     } else {
        //                         tmpMember = members.get(identity.id);
        //                         tmpMember.teams.push(project.defaultTeam.id);
        //                     }
        //                 })
        //             });
        //             promises.push(promise);
        //         });
        //         return $q.all(promises).then(() => [...members.values()]);
        //     });
        // }

        function getRepositories() {
            return $http({
                method: "GET",
                url: domainToUse.vstsUrl + "/git/repositories",
            }).then((httpRepositories) => httpRepositories.data.value);
        }

        function setCredentials(credentials) {
            if(credentials.vstsName && credentials.mail && credentials.accessKey) {
                domainToUse = {
                    vstsName: credentials.vstsName,
                    basic:btoa(credentials.mail.toLowerCase() + ":" + credentials.accessKey), 
                    vstsUrl: "https://" + credentials.vstsName + ".visualstudio.com/DefaultCollection/_apis",
                    domainUrl: "https://" + credentials.vstsName + ".visualstudio.com"
                };
                $http.defaults.headers.common.Authorization = "Basic " + domainToUse.basic;
                return getAllProjects().then(
                    () => {
                        settingsService.setCurrentDomain(domainToUse);
                        initialize.resolve("init ok");
                    }, 
                    (error) => $q.reject(error)
                );
            } else {
                return $q.reject("missing arguments");
            }
        }

        function isInitialize() {
            return initialize.promise;
        }

        function isLoginInitialize() {
            return loginInitialize.promise;
        }

        function toggleAutoComplete(pr) {
            let currentMember = memberService.getCurrentMember();
            if(!currentMember) {
                return $q.reject("no current member");
            }
            return getFullPullRequest(pr).then((refreshPr) => {
                let data = {
                    "autoCompleteSetBy": {
                        "id": refreshPr.autoCompleteSetBy !== undefined ? resetGUID : currentMember.id
                    }
                };
                return $http({
                    "method": "PATCH",
                    "url": pr.url,
                    "params": {
                        "api-version":"3.0"
                    },
                    "data": data
                }).then(
                    (httpPullRequest) => httpPullRequest.data, 
                    (error) => error
                );
            });
        }

        function getSuggestionForUser() {
            return getAllSuggestions().then((suggestions) => {
                let currentMember = memberService.getCurrentMember();
                let promises = [];
                if(currentMember) {
                    suggestions.filter((suggestion) => suggestion.suggestion.length > 0).forEach((suggestion) => {
                        suggestion.suggestion.filter((sug) => sug.type === "pullRequest").forEach((sug) => {
                            let promise = $http({
                                method: "GET",
                                url: `${suggestion.repository.url}/commits?branch=${sug.properties.sourceBranch.replace('refs/heads/', '')}&$top=1`
                            }).then(({data}) => {
                                let [lastCommit] = data.value;
                                if(lastCommit && lastCommit.committer.email === currentMember.uniqueName) {
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
                return $q.all(promises);
            });
        }

        function getAllSuggestions() {
            return getRepositories().then((respositories) => {
                let promises = [];
                respositories.forEach((repository) => {
                    let promise = $http({
                        method: "GET",
                        url: repository.url + "/suggestions"
                    }).then(({data}) => ({
                        repository: repository,
                        suggestion: data.value
                    }));
                    promises.push(promise);
                });
                return $q.all(promises);
            });
        }

        return {
            isInitialize: isInitialize,
            isLoginInitialize: isLoginInitialize,
            getTeamMembers,
            getPullRequests: getPullRequests,
            setCredentials: setCredentials,
            toggleAutoComplete: toggleAutoComplete,
            getSuggestionForUser: getSuggestionForUser
        };
    }
})();