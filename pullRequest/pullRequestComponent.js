(function() {
    angular.module('vstsChrome').component("pullRequest", {
        controller: PullRequestController,
        controllerAs: "prCtrl",
        templateUrl: "pullRequest/pullRequest.html",
        css: "pullRequest/pullRequest.css"
    });

    angular.module('vstsChrome').directive('fallbackSrc', function () {
        var fallbackSrc = {
            link: function postLink(scope, iElement, iAttrs) {
            iElement.bind('error', function() {
                angular.element(this).attr("src", iAttrs.fallbackSrc);
            });
            }
        }
        return fallbackSrc;
    });


    PullRequestController.$inject=['vstsService', 'memberService'];
    function PullRequestController(vstsService, memberService) {
        var prCtrl = this;
        this.$onInit = function() {
            prCtrl.fillPullRequests = function() {
                prCtrl.pullRequests = prCtrl.allPullRequests;
                memberService.hideMembers();
            };

            prCtrl.fillToApprovePullRequests = function() {
                prCtrl.pullRequests = prCtrl.toApprovePullRequests;
                addCurrentMemberVote(prCtrl.pullRequests);
                memberService.hideMembers();
            };

            function addCurrentMemberVote(prs) {
                const currentMember = memberService.getCurrentMember();
                if(currentMember) {
                    prs.forEach((pr) => {
                        const currentMemberReviews = pr.reviewers.filter((reviewer) => reviewer.uniqueName === currentMember.uniqueName);
                        if(currentMemberReviews.length > 0) {
                            pr.currentMemberVote = currentMemberReviews[0].vote;
                        }
                    });
                }
            }

            prCtrl.reviewClass = function(pr) {
                return {'review-rejected': (pr.currentMemberVote === -10), 'review-waiting': (pr.currentMemberVote === -5)};
            }

            prCtrl.fillMinePullRequests = function() {
                prCtrl.pullRequests = prCtrl.minePullRequests;
                memberService.hideMembers();
            }

            prCtrl.isMinePullRequests = function() {
                return prCtrl.pullRequests === prCtrl.minePullRequests;
            }

            prCtrl.isToApprovePullRequests = function() {
                return prCtrl.pullRequests === prCtrl.toApprovePullRequests;
            }

            prCtrl.isAllPullRequests = function() {
                return prCtrl.pullRequests === prCtrl.allPullRequests;
            }

            prCtrl.redirect = function(pr) {
                var href = pr.url.split('DefaultCollection')[0] + pr.repository.project.name + "/_git/" + pr.repository.id + "/pullrequest/" + pr.pullRequestId; 
                chrome.tabs.create({url: href, active: false});
            };

            prCtrl.memberSelected = function(member) {
                getPullRequests().then(function() {
                    prCtrl.fillToApprovePullRequests();
                });
            }

            prCtrl.membersDisplay = function() {
                prCtrl.pullRequests = [];
            }
        }

        prCtrl.toggleAutoComplete = function(pr) {
            vstsService.toggleAutoComplete(pr).then(function(refreshPr) {
                pr.autoCompleteSetBy = refreshPr.autoCompleteSetBy;
            });
        }

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