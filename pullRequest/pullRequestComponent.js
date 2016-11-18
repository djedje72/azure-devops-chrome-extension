(function() {
    angular.module('vstsChrome').component("pullRequest", {
        controller: PullRequestController,
        controllerAs: "prCtrl",
        templateUrl: "pullRequest/pullRequest.html",
        css: "pullRequest/pullRequest.css"
    })
    var axaDomain = {name: "axafrance", basic: btoa("remi.fruteaudelaclos@axa.fr:35mxntrvieqejjzwveal5tgmd6fx6x5t55uaodflpz2mpkbr2eka")};
    var persoDomain = {name: "djedje72", basic: btoa("remi.fruteau@hotmail.fr:qlokfjlonjua6wtji6fp2cg7k3vcuh3gdfk3gunbwjqlgnawk3ma")};
    var domainToUse = axaDomain;


    PullRequestController.$inject=['$q','$http'];
    function PullRequestController($q, $http) {
        var prCtrl = this;
        var webUrl = null;
        this.$onInit = function() {

            prCtrl.fillPullRequests = function() {
                prCtrl.pullRequests = prCtrl.allPullRequests;
            };

            prCtrl.fillToApprovePullRequests = function(button) {
                prCtrl.pullRequests = prCtrl.toApprovePullRequests;
                button.disabled=true;
            };

            prCtrl.redirect = function(pr) {
                if(webUrl !== null) {
                    var href = webUrl + "/_git/" + pr.repository.id + "/pullrequest/" + pr.pullRequestId; 
                    chrome.tabs.create({url: href});
                }
            };

            prCtrl.memberSelected = function(member) {
                prCtrl.currentMember = member;
                localStorage.setItem("currentMember", JSON.stringify(member));
                getToApprovePullRequests();
                prCtrl.fillToApprovePullRequests();
            }

            prCtrl.membersDisplay = function() {
                prCtrl.pullRequests = [];
            }
        }

        var vstsUrl = "https://" + domainToUse.name + ".visualstudio.com/DefaultCollection/_apis";

        function initCurrentMember() {
            var currentMemberStr = localStorage.getItem("currentMember");
            if(currentMemberStr !== null) {
                try{
                    prCtrl.currentMember = JSON.parse(currentMemberStr);
                } catch(e) {
                    localStorage.removeItem("currentMember");
                    prCtrl.currentMember = null;
                }
            } else {
                prCtrl.currentMember = null;
            }
        }

        function getToApprovePullRequests() {
            if(prCtrl.currentMember !== null) {
                prCtrl.toApprovePullRequests = [];
                var toApprovePullRequestsTmp = prCtrl.allPullRequests.filter(function(pullRequest) {
                    var toApprovePullRequest = pullRequest.reviewers.filter(function(reviewer) {
                        return reviewer.uniqueName === prCtrl.currentMember.uniqueName && reviewer.vote === 0;
                    });
                    if (toApprovePullRequest.length > 0) {
                        return true;
                    }
                    return false;
                });
                prCtrl.toApprovePullRequests = prCtrl.toApprovePullRequests.concat(toApprovePullRequestsTmp);
                setReminder();
            }
        }

        function setReminder() {
            var nbToApprovePullRequests = prCtrl.toApprovePullRequests.length;
            if(nbToApprovePullRequests > 0) {
                chrome.browserAction.setBadgeText({text: nbToApprovePullRequests.toString()});
                chrome.browserAction.setBadgeBackgroundColor({color: "#FF9999"});
            } else {
                chrome.browserAction.setBadgeText({text: ""});
            };
        }

        function getPullRequests(repositories) {
            var deferred = $q.defer();
            var count = 0;
            var allPullRequests = [];
            var promises = [];

            repositories.forEach(function(repository) {
                var httpPromise = $http({
                    method: "GET",
                    url: vstsUrl + "/git/repositories/"+repository.id+"/pullRequests",
                }).then(function(httpPullRequests) {
                    var pullRequests = httpPullRequests.data.value;
                    allPullRequests = allPullRequests.concat(pullRequests);
                });
                promises.push(httpPromise);
            });
            return $q.all(promises).then(function() {
                prCtrl.allPullRequests = allPullRequests;
                getToApprovePullRequests();
            });
        }

        function getMainProject() {
            return $http({
                method: "GET",
                url: vstsUrl + "/projects"
            }).then(function(httpProjects) {
                return $http({
                    method: "GET",
                    url: httpProjects.data.value[0].url
                }).then(function(httpMainProject) {
                    var mainProject = httpMainProject.data;
                    webUrl = mainProject._links.web.href;
                    return httpMainProject.data;
                });
            });
        }

        function getDefaultTeamMembers() {
            return getMainProject().then(function(mainProject) {
                return $http({
                    method: "GET",
                    url: mainProject.defaultTeam.url + "/members"
                }).then(function(httpMembers) {
                    return httpMembers.data.value;
                });
            });
        }

        function getRepositories(repositories) {
            return $http({
                method: "GET",
                url: vstsUrl + "/git/repositories",
            }).then(function(httpRepositories) {
                return httpRepositories.data.value;
            });
        }
        
        function getAllUsers() {
            return $http({
                method: "GET",
                url: vstsUrl + "/projects/AF.Ose/teams/AF.OSE%20Team/members",
            });
        }

        function initGit() {
            getDefaultTeamMembers().then(function(members) {
                prCtrl.members = members;
            });
            getRepositories()
                .then(getPullRequests)
                .then(function() {
                    prCtrl.hideLoading = true;
                });
        }
        
        $http.defaults.headers.common.Authorization = "Basic " + domainToUse.basic;
        initCurrentMember();
        initGit();

        chrome.alarms.create("refresh", {"delayInMinutes":1, "periodInMinutes":1});

        chrome.alarms.onAlarm.addListener(function(alarm) {
            if(alarm.name == "refresh") {
                initGit();
            }
        });
    }
})();

//https://app.vssps.visualstudio.com/_apis/profile/profiles/me ->emailAddress


//https://axafrance.visualstudio.com/DefaultCollection/_apis/projects
//value.url -> https://axafrance.visualstudio.com/DefaultCollection/_apis/projects/a1f7ca85-3902-4d3f-bd0d-94128cf2b491
//defaultTeam.url /members -> https://axafrance.visualstudio.com/DefaultCollection/_apis/projects/a1f7ca85-3902-4d3f-bd0d-94128cf2b491/teams/83bac5fb-ef79-450d-afad-1dcf413b17b0/members
//

//