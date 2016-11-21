(function() {
    angular.module('vstsChrome').service("vstsService", VstsService);

    VstsService.$inject=['$http', '$q', 'memberService'];
    function VstsService($http, $q, memberService) {

        var axaDomain = {name: "axafrance", basic: btoa("remi.fruteaudelaclos@axa.fr:35mxntrvieqejjzwveal5tgmd6fx6x5t55uaodflpz2mpkbr2eka")};
        var persoDomain = {name: "djedje72", basic: btoa("remi.fruteau@hotmail.fr:qlokfjlonjua6wtji6fp2cg7k3vcuh3gdfk3gunbwjqlgnawk3ma")};
        var domainToUse = axaDomain;

        $http.defaults.headers.common.Authorization = "Basic " + domainToUse.basic;

        var vstsUrl = "https://" + domainToUse.name + ".visualstudio.com/DefaultCollection/_apis";

        var mainProject;

        function getToApprovePullRequests(allPullRequests) {
            var currentMember = memberService.getCurrentMember();
            if(allPullRequests.length > 0 && currentMember) {
                var toApprovePullRequests = allPullRequests.filter(function(pullRequest) {
                    var toApprovePullRequest = pullRequest.reviewers.filter(function(reviewer) {
                        return reviewer.uniqueName === currentMember.uniqueName && reviewer.vote === 0;
                    });
                    if (toApprovePullRequest.length > 0) {
                        return true;
                    }
                    return false;
                });
                setReminder(toApprovePullRequests);
                return toApprovePullRequests;
            }
        }

        function setReminder(toApprovePullRequests) {
            var nbToApprovePullRequests = toApprovePullRequests.length;
            if(nbToApprovePullRequests > 0) {
                chrome.browserAction.setBadgeText({text: nbToApprovePullRequests.toString()});
                chrome.browserAction.setBadgeBackgroundColor({color: "#FF9999"});
            } else {
                chrome.browserAction.setBadgeText({text: ""});
            };
        }

        function getPullRequests() {
            var allPullRequests = [];
            var promises = [];
            return $http({
                method: "GET",
                url: vstsUrl + "/git/pullRequests"
            }).then(function(httpPullRequests) {
                var allPullRequests = httpPullRequests.data.value;
                return {
                    "all": allPullRequests,
                    "toApprove": getToApprovePullRequests(allPullRequests)
                };
            });
        }
        
        function getAllProjects() {
            return $http({
                method: "GET",
                url: vstsUrl + "/projects"
            }).then(function(httpProjects) {
                return httpProjects.data;
            });
        }

        function getMainProjectWebUrl() {
            return getMainProject()._links.web.href;
        }

        function getMainProject() {
            if(mainProject !== undefined) {
                return mainProject;
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

        return {
            getAllUsers: getAllUsers,
            getTeamMembers: getTeamMembers,
            getPullRequests: getPullRequests,
            getMainProjectWebUrl: getMainProjectWebUrl
        };
    }
})();