import {getCurrentMember} from "../member/memberService.js";
import {removeCurrentDomain} from "../settings/settingsService.js";
import {removeCurrentMember, getGraphAvatar} from "../member/memberService.js";
import {removeOAuthToken} from "../oauth/index.js";

import {mainModule} from "../index.js";
import "./pullRequest-reviewers/pullRequestReviewersComponent.js";
import "./pullRequest-creator/pullRequestCreatorComponent.js";
import "./pullRequest.css";
import template from "./pullRequest.html";


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

class PullRequestController {
	static $inject = ['vstsService', '$rootScope'];
	constructor(vstsService, $rootScope) {
		this.vstsService = vstsService;
		this.$rootScope = $rootScope;
	}
	_mine = 'mine';
	_toApprove = 'toApprove';
	_all = 'all';

	$onInit = () => {
		this.currentButton = this._toApprove;
		const { enableNotifications } = this.getSettings();
		this.enableNotifications = enableNotifications;
		this.vstsService
			.isInitialize()
			.then(() => this.getPullRequests())
			.then(() => this.fillToApprovePullRequests())
			.finally(() => {
				this.isInitialized = true;
				this.initialized();
				this.$rootScope.$digest();
			});
	};

	fillPullRequests = () => {
		this.currentButton = this._all;
		this.showSettings = false;
		this.pullRequests.forEach(pr => {
			pr.isVisible = true;
		});
	};

	fillToApprovePullRequests = () => {
		this.currentButton = this._toApprove;
		this.showSettings = false;
		const toApprove = this.toApprovePullRequests.map(pr => pr.pullRequestId);
		this.pullRequests.forEach(pr => {
			pr.isVisible = toApprove.includes(pr.pullRequestId);
		});
	};

	withCurrentMemberVote = async prs => {
		const currentMember = await getCurrentMember();
		if (currentMember) {
			return prs.map(pr => {
				const currentMemberReviews = pr.reviewers.filter(
					reviewer => reviewer.uniqueName === currentMember.emailAddress
				);
				if (currentMemberReviews.length > 0) {
					pr.currentMemberVote = currentMemberReviews[0].vote;
				}
				return pr;
			});
		}
		return prs;
	};

	toggleMode = () => {
		const { darkMode } = this.getSettings();
		this.storeSetting("darkMode", !darkMode);
	};

	reviewClass = ({ currentMemberVote, autoCompleteSetBy, isDraft }) => ({
		'review-rejected': currentMemberVote === -10,
		'review-waiting': currentMemberVote === -5,
		'autocomplete-active': autoCompleteSetBy,
		'draft-active': isDraft
	});

	fillMinePullRequests = () => {
		this.currentButton = this._mine;
		this.showSettings = false;
		const mines = this.minePullRequests.map(pr => pr.pullRequestId);
		this.pullRequests.forEach(pr => {
			pr.isVisible = mines.includes(pr.pullRequestId);
		});
	};

	isMinePullRequests = () => this.currentButton === this._mine;
	isToApprovePullRequests = () => this.currentButton === this._toApprove;
	isAllPullRequests = () => this.currentButton === this._all;
	redirect = pr => {
		var href = `${pr.repository.remoteUrl.replace(/(:\/\/)([^/]*@)/, '$1')}/pullrequest/${pr.pullRequestId}`;
		browser.tabs.create({ url: href, active: false });
	};

	policiesDetails = policies => {
		let result = '';
		if (policies) {
			Object.keys(policies).forEach(policyKey => {
				if (policies.hasOwnProperty(policyKey)) {
					const policy = policies[policyKey];
					if (!policy) {
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
		this.storeSetting('enableNotifications', this.enableNotifications);
	};
	storeSetting = (key, value) => {
		const settings = this.getSettings();
		settings[key] = value;
		localStorage.setItem('settings', JSON.stringify(settings));
	};
	getSettings = () => JSON.parse(localStorage.getItem('settings')) || {};
	durationToDisplay = ({ creationDate }) => moment(creationDate).fromNow();
	valueOfDate = ({ creationDate }) => moment(creationDate).valueOf();
	isReviewerToDisplay = reviewer => reviewer.isRequired || reviewer.vote > 0;

	getImageWithTodayStr = async ({ id }) => `data:image/png;base64,${await getGraphAvatar({ id })}`;

	getPullRequests = async () => {
		const { all, toApprove, mine } = await this.vstsService.getPullRequests();
		this.pullRequests = await this.withCurrentMemberVote(all);
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
    template
});
