(function() {
    angular.module('vstsChrome').component("pullRequest", {
        controller: PullRequestController,
        controllerAs: "prCtrl",
        templateUrl: "pullRequest/pullRequest.html",
        css: "pullRequest/pullRequest.css"
    });

    PullRequestController.$inject=['$q','$http', 'vstsService', 'memberService'];
    function PullRequestController($q, $http, vstsService, memberService) {
        var prCtrl = this;
        this.$onInit = function() {
            prCtrl.fillPullRequests = function() {
                prCtrl.pullRequests = prCtrl.allPullRequests;
                memberService.hideMembers();
            };

            prCtrl.fillToApprovePullRequests = function() {
                prCtrl.pullRequests = prCtrl.toApprovePullRequests;
                memberService.hideMembers();
            };

            prCtrl.fillMinePullRequests = function() {
                prCtrl.pullRequests = prCtrl.minePullRequests;
                memberService.hideMembers();
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


//qlokfjlonjua6wtji6fp2cg7k3vcuh3gdfk3gunbwjqlgnawk3ma

        prCtrl.members = vstsService.getTeamMembers();
        
        function getPullRequests() {
            return vstsService.getPullRequests().then(function(pullRequests) {
                prCtrl.allPullRequests = pullRequests.all;
                prCtrl.toApprovePullRequests = pullRequests.toApprove;
                prCtrl.minePullRequests = pullRequests.mine;
            });
        }

        prCtrl.isInitialize = false;
        
        vstsService.isInitialize()
            .then(function() {
                prCtrl.isInitialize = true;
            })
            .then(getPullRequests)
            .then(function() {
                prCtrl.hideLoading = true;
                prCtrl.fillToApprovePullRequests();
        })
        
    }
})();