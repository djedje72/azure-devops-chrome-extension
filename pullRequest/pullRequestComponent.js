import {getCurrentMember} from "../member/memberService.js";
import {removeCurrentDomain} from "../settings/settingsService.js";
import {removeCurrentMember, getGraphAvatar} from "../member/memberService.js";
import {removeOAuthToken} from "../oauth/index.js";

import {mainModule} from "../index.js";
import "./pullRequest-reviewers/pullRequestReviewersComponent.js";

mainModule.directive('fallbackSrc', function () {
    var fallbackSrc = {
        link: function postLink(scope, iElement, iAttrs) {
        iElement.bind('error', function() {
            angular.element(this).attr("src", iAttrs.fallbackSrc);
        });
        }
    }
    return fallbackSrc;
});

class PullRequestController{
    static $inject=['vstsService', '$rootScope'];
    constructor(vstsService, $rootScope) {
        this.vstsService = vstsService;
        this.$rootScope = $rootScope;
    }

    $onInit = () => {
        const {enableNotifications} = this.getSettings();
        this.enableNotifications = enableNotifications;
        this.vstsService.isInitialize()
            .then(() => this.getPullRequests())
            .then(() => this.fillToApprovePullRequests())
            .finally(() => {
                this.isInitialized = true;
                this.initialized();
                this.$rootScope.$digest();
            });
    };

    fillPullRequests = () => {
        this.showSettings = false;
        this.pullRequests = this.allPullRequests;
    };

    fillToApprovePullRequests = () => {
        this.showSettings = false;
        this.pullRequests = this.toApprovePullRequests;
    };

    withCurrentMemberVote = async(prs) => {
        const currentMember = await getCurrentMember();
        if(currentMember) {
            return prs.map(pr => {
                const currentMemberReviews = pr.reviewers.filter((reviewer) => reviewer.uniqueName === currentMember.emailAddress);
                if(currentMemberReviews.length > 0) {
                    pr.currentMemberVote = currentMemberReviews[0].vote;
                }
                return pr;
            });
        }
        return prs;
    };

    reviewClass = ({currentMemberVote}) => ({
        'review-rejected': (currentMemberVote === -10),
        'review-waiting': (currentMemberVote === -5)
    });

    fillMinePullRequests = () => {
        this.showSettings = false;
        this.pullRequests = this.minePullRequests;
    };

    isMinePullRequests = () => this.pullRequests === this.minePullRequests;
    isToApprovePullRequests = () => this.pullRequests === this.toApprovePullRequests;
    isAllPullRequests = () => this.pullRequests === this.allPullRequests;
    redirect = (pr) => {
        var href = `${pr.repository.remoteUrl.replace(/(:\/\/)([^/]*@)/, "$1")}/pullrequest/${pr.pullRequestId}`;
        chrome.tabs.create({url: href, active: false});
    };

    policiesDetails = (policies) => {
        let result = "";
        if(policies) {
            Object.keys(policies).forEach((policyKey) => {
                if(policies.hasOwnProperty(policyKey)) {
                    const policy = policies[policyKey];
                    if(!policy) {
                        result += `${policyKey} -> ERROR \n`;
                    }
                }
            });
        }
        return result;
    };

    toggleSettings = () => {
        this.showSettings = !this.showSettings;
    };
    toggleNotifications = () => {
        this.storeSetting("enableNotifications", this.enableNotifications);
    };
    storeSetting = (key, value) => {
        const settings = this.getSettings();
        settings[key] = value;
        localStorage.setItem("settings", JSON.stringify(settings));
    };
    getSettings = () => JSON.parse(localStorage.getItem("settings")) || {};
    durationToDisplay = ({creationDate}) => moment(creationDate).fromNow();
    valueOfDate = ({creationDate}) => moment(creationDate).valueOf();
    isReviewerToDisplay = (reviewer) => reviewer.isRequired || reviewer.vote > 0;

    getImageWithTodayStr = async({id}) => `data:image/png;base64,${await getGraphAvatar({id})}`;

    getPullRequests = async() => {
        const {all, toApprove, mine} = await this.vstsService.getPullRequests();
        this.allPullRequests = await this.withCurrentMemberVote(all);
        this.toApprovePullRequests = await this.withCurrentMemberVote(toApprove);
        this.minePullRequests = await this.withCurrentMemberVote(mine);
    };

    logout = () => {
        removeCurrentDomain();
        removeOAuthToken();
        removeCurrentMember();
        window.location.reload();
    };
}

mainModule.component("pullRequest", {
    controller: PullRequestController,
    bindings: {
        "initialized": "&"
    },
    templateUrl: "pullRequest/pullRequest.html",
    css: "pullRequest/pullRequest.css"
});
