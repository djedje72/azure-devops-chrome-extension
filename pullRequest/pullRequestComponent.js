(function() {
    angular.module('vstsChrome').component("pullRequest", {
        controller: PullRequestController,
        controllerAs: "prCtrl",
        templateUrl: "pullRequest/pullRequest.html",
        css: "pullRequest/pullRequest.css"
    });

    PullRequestController.$inject=['$q','$http', 'vstsService'];
    function PullRequestController($q, $http, vstsService) {
        var prCtrl = this;
        this.$onInit = function() {
            prCtrl.fillPullRequests = function() {
                prCtrl.pullRequests = prCtrl.allPullRequests;
            };

            prCtrl.fillToApprovePullRequests = function() {
                prCtrl.pullRequests = prCtrl.toApprovePullRequests;
            };

            prCtrl.fillMinePullRequests = function() {
                prCtrl.pullRequests = prCtrl.minePullRequests;
            }

            prCtrl.redirect = function(pr) {
                var href = vstsService.getMainProjectWebUrl() + "/_git/" + pr.repository.id + "/pullrequest/" + pr.pullRequestId; 
                chrome.tabs.create({url: href, active: false});
            };

            prCtrl.memberSelected = function(member) {
               getPullRequests().then(function() {
                    prCtrl.fillToApprovePullRequests();
                })
            }

            prCtrl.membersDisplay = function() {
                prCtrl.pullRequests = [];
            }
        }

        prCtrl.members = vstsService.getTeamMembers();
        
        function getPullRequests() {
            return vstsService.getPullRequests().then(function(pullRequests) {
                prCtrl.allPullRequests = pullRequests.all;
                prCtrl.toApprovePullRequests = pullRequests.toApprove;
                prCtrl.minePullRequests = pullRequests.mine;
            });
        }

        prCtrl.isInitialize = function() {
            return vstsService.isInitialize();
        }

        getPullRequests().then(function() {
            prCtrl.hideLoading = true;
            prCtrl.fillToApprovePullRequests();
        })
        
    }
})();