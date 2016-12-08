(function() {
    angular.module('vstsChrome').service("vstsService", VstsService);

    VstsService.$inject=['$http', '$q', 'memberService', 'settingsService'];
    function VstsService($http, $q, memberService, settingsService) {
        let resetGUID = "00000000-0000-0000-0000-000000000000";
        
        let initialize = $q.defer();
        let domainToUse = settingsService.getCurrentDomain();
        if (domainToUse) {
            initialize.resolve("init ok");
        } else {
            domainToUse = {};
        }
        $http.defaults.headers.common.Authorization = "Basic " + domainToUse.basic;
    
        let mainProject;

        function getToApprovePullRequests(pullRequests) {
            let currentMember = memberService.getCurrentMember();
            if(pullRequests.length > 0 && currentMember) {
                let toApprovePullRequests = pullRequests.filter(function(pullRequest) {
                    if(pullRequest.reviewers) {
                        let toApprovePullRequest = pullRequest.reviewers.filter(function(reviewer) {
                            return reviewer.uniqueName === currentMember.uniqueName && reviewer.vote === 0;
                        });
                        if (toApprovePullRequest.length > 0) {
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
                return pullRequests.filter(function(pullRequest) {
                    return currentMember.uniqueName === pullRequest.createdBy.uniqueName;
                });
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
            return getPolicyResult(fullPr).then(function(evaluations) {
                let state;
                let policies = {};

                if(evaluations.length > 0) {
                    const policiesText = {
                        build: "Build",
                        reviewers: "Minimum number of reviewers",
                        workItemLink: "Work item linking"
                    }

                    let nbApproved = 0;
                    let successEval = evaluations.forEach(function(eval) {
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
            return getMainProject().then(function(mainProject) {
                return $http({
                    method:"GET",
                    url: domainToUse.domainUrl + "/" + mainProject.id + "/_apis/policy/Evaluations",
                    params: {
                        artifactId: "vstfs:///CodeReview/CodeReviewId/" + mainProject.id + "/" + pr.codeReviewId
                    }
                }).then(function(httpEvaluation) {
                    return httpEvaluation.data.value;
                });
            });
        }

        function getPullRequests() {
            return getPullRequestsList().then(function(pullRequests) {
                let promises = [];
                let fullPullRequests = [];
                pullRequests.forEach(function(pr) {
                    promises.push(getFullPullRequest(pr).then(function(fullPr) {
                        fullPullRequests.push(fullPr);
                    }));
                });
                return $q.all(promises).then(function() {
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
            }).then(function(httpPullRequests) {
                return httpPullRequests.data.value;
            });
        }

        function getAllProjects() {
            return $http({
                method: "GET",
                url: domainToUse.vstsUrl + "/projects"
            }).then(function(httpProjects) {
                return httpProjects.data;
            });
        }

        function getMainProjectWebUrl() {
            return getMainProject().then(function(mainProject) {
                return mainProject._links.web.href;
            });
        }

        function getMainProject() {
            if(mainProject !== undefined) {
                return $q.resolve(mainProject);
            }
            return getAllProjects().then(function(projects) {
                return $http({
                    method: "GET",
                    url: projects.value[0].url
                }).then(function(httpMainProject) {
                    mainProject = httpMainProject.data;
                    return mainProject;
                });
            });
        }

        function getTeamMembers() {
            return getMainProject().then(function(mainProject) {
                return $http({
                    method: "GET",
                    url: mainProject.defaultTeam.url + "/members"
                }).then(function(httpMembers) {
                    return httpMembers.data.value;
                });
            });
        }

        function getRepositories() {
            return $http({
                method: "GET",
                url: domainToUse.vstsUrl + "/git/repositories",
            }).then(function(httpRepositories) {
                return httpRepositories.data.value;
            });
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
                return getAllProjects().then(function() {
                    settingsService.setCurrentDomain(domainToUse);
                    initialize.resolve("init ok");
                }, function(error) {
                    return $q.reject(error);
                });
            } else {
                return $q.reject("missing arguments");
            }
        }

        function isInitialize() {
            return initialize.promise;
        }

        function toggleAutoComplete(pr) {
            let currentMember = memberService.getCurrentMember();
            if(!currentMember) {
                return $q.reject("no current member");
            }
            return getFullPullRequest(pr).then(function(refreshPr) {
                return getMainProjectWebUrl().then(function(mainProjectUrl) {
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
                    }).then(function(httpPullRequest) {
                        return httpPullRequest.data;
                    }, function(error) {
                        console.log(error);
                        return error;
                    });
                });
            });
            
        }


        return {
            isInitialize: isInitialize,
            getTeamMembers: getTeamMembers,
            getPullRequests: getPullRequests,
            getMainProjectWebUrl: getMainProjectWebUrl,
            setCredentials: setCredentials,
            toggleAutoComplete: toggleAutoComplete
        };
    }
})();