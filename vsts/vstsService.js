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

        function getMinePullRequests(pullRequests) {
            let currentMember = memberService.getCurrentMember();
            if(pullRequests.length > 0 && currentMember) {
                return pullRequests.filter((pullRequest) => currentMember.uniqueName === pullRequest.createdBy.uniqueName);
            }
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
                    const policiesText = {
                        build: "Build",
                        reviewers: "Minimum number of reviewers",
                        workItemLink: "Work item linking"
                    }

                    let nbApproved = 0;
                    let successEval = evaluations.forEach((eval) => {
                        for(var key in policiesText) {
                            if(policiesText.hasOwnProperty(key)) {
                                var policyText = policiesText[key]; 
                                if(eval.configuration.type.displayName === policyText) {
                                    if(eval.status === "approved") {
                                        nbApproved++;
                                        policies[key] = "success";
                                    } else {
                                        policies[key] = "error";
                                    }
                                }
                            }
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

        function getPolicyResult(pr) {
            return $http({
                method:"GET",
                url: domainToUse.domainUrl + "/" + pr.repository.project.id + "/_apis/policy/Evaluations",
                params: {
                    artifactId: "vstfs:///CodeReview/CodeReviewId/" + pr.repository.project.id + "/" + pr.codeReviewId
                }
            }).then((httpEvaluation) => httpEvaluation.data.value);
        }

        function getPullRequests() {
            return getPullRequestsList().then(function(pullRequests) {
                let promises = [];
                let fullPullRequests = [];
                pullRequests.forEach((pr) => {
                    promises.push(getFullPullRequest(pr).then((fullPr) => {
                        fullPullRequests.push(fullPr);
                    }));
                });
                return $q.all(promises).then(() => {
                    return {
                        "all": fullPullRequests,
                        "toApprove": getToApprovePullRequests(fullPullRequests),
                        "mine": getMinePullRequests(fullPullRequests)
                    };
                }) 
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

        function getTeamMembers() {
            return getAllProjects().then((projects) => {
                let promises = [];
                let members = new Map();
                projects.forEach((project) => {
                    let promise = $http({
                        method: "GET",
                        url: project.defaultTeam.url + "/members"
                    }).then(function(httpMembers) {
                        httpMembers.data.value.forEach((member) => {
                            if(!members.has(member.id)) {
                                member.teams = [project.defaultTeam.id];
                                members.set(member.id, member);
                            } else {
                                tmpMember = members.get(member.id);
                                tmpMember.teams.push(project.defaultTeam.id);
                            }
                        })
                    });
                    promises.push(promise);
                });
                return $q.all(promises).then(() => [...members.values()]);
            });
        }

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
                                url: `${suggestion.repository.url}/commits?branch=${sug.properties.sourceBranch.replace('refs/heads/', '')}`
                            }).then((commits) => {
                                let lastCommit = commits.data.value[0];
                                if(lastCommit && lastCommit.committer.email === currentMember.uniqueName) {
                                    return Object.assign({
                                        remoteUrl: suggestion.repository.remoteUrl
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
                    }).then((suggestions) => {
                        return {
                            repository: repository,
                            suggestion: suggestions.data.value
                        };
                    });
                    promises.push(promise);
                });
                return $q.all(promises);
            });
        }

        return {
            isInitialize: isInitialize,
            isLoginInitialize: isLoginInitialize,
            getTeamMembers: getTeamMembers,
            getPullRequests: getPullRequests,
            setCredentials: setCredentials,
            toggleAutoComplete: toggleAutoComplete,
            getSuggestionForUser: getSuggestionForUser
        };
    }
})();