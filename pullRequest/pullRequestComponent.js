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
                prCtrl.showSettings = false;
                prCtrl.pullRequests = prCtrl.allPullRequests;
                memberService.hideMembers();
            };

            prCtrl.fillToApprovePullRequests = function() {
                prCtrl.showSettings = false;
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
            };

            prCtrl.fillMinePullRequests = function() {
                prCtrl.showSettings = false;
                prCtrl.pullRequests = prCtrl.minePullRequests;
                memberService.hideMembers();
            };

            prCtrl.isMinePullRequests = function() {
                return prCtrl.pullRequests === prCtrl.minePullRequests;
            };

            prCtrl.isToApprovePullRequests = function() {
                return prCtrl.pullRequests === prCtrl.toApprovePullRequests;
            };

            prCtrl.isAllPullRequests = function() {
                return prCtrl.pullRequests === prCtrl.allPullRequests;
            };

            prCtrl.redirect = function(pr) {
                var href = `${pr.repository.remoteUrl}/pullrequest/${pr.pullRequestId}`; 
                chrome.tabs.create({url: href, active: false});
            };

            prCtrl.memberSelected = function(member) {
                getPullRequests().then(function() {
                    prCtrl.fillToApprovePullRequests();
                });
            };

            prCtrl.membersDisplay = function() {
                prCtrl.pullRequests = [];
            };

            prCtrl.policiesDetails = function(policies) {
                let result = "";
                if(policies) {
                    Object.keys(policies).forEach((policyKey) => {
                        if(policies.hasOwnProperty(policyKey)) {
                            let policy = policies[policyKey];
                            if(!policy) {
                                result += `${policyKey} -> ERROR \n`;
                            }
                        }
                    });
                }
                return result;
            };

            prCtrl.toggleSettings = function() {
                prCtrl.showSettings = !prCtrl.showSettings;
            };

            prCtrl.toggleNotifications = function() {
                prCtrl.storeSetting("enableNotifications", prCtrl.enableNotifications);
            };

            prCtrl.storeSetting = function(key, value) {
                const settings = prCtrl.getSettings();
                settings[key] = value;
                localStorage.setItem("settings", JSON.stringify(settings));
            };

            prCtrl.getSettings = () => JSON.parse(localStorage.getItem("settings")) || {};

            const {enableNotifications} = prCtrl.getSettings();
            prCtrl.enableNotifications = enableNotifications;
        }

        prCtrl.toggleAutoComplete = function($event, pr) {
            $event.stopPropagation();
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
            .then(() => {
                prCtrl.isInitialize = true;
            })
            .then(() => getPullRequests())
            .then(() => prCtrl.fillToApprovePullRequests())
            .finally(() => {
                prCtrl.hideLoading = true;
            });
        
    }
})();