import {getCurrentMember} from "../member/memberService.js";
import {removeCurrentDomain} from "../settings/settingsService.js";
import {removeCurrentMember, getGraphAvatar} from "../member/memberService.js";
import {removeOAuthToken} from "../oauth/index.js";

import {mainModule} from "../index.js";
import "./pullRequest-reviewers/pullRequestReviewersComponent";
import "./pullRequest-creator/pullRequestCreatorComponent";
import "./pullRequest";

import "./pullRequests.css";
import template from "./pullRequests.html";

class PullRequestsController {
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
			.finally(() => {
				this.fillToApprovePullRequests();
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
		this.pullRequests.forEach(pr => {
			pr.isVisible = this.toApprovePullRequests.includes(pr.pullRequestId);
		});
	};

	fillMinePullRequests = () => {
		this.currentButton = this._mine;
		this.showSettings = false;
		this.pullRequests.forEach(pr => {
			pr.isVisible = this.minePullRequests.includes(pr.pullRequestId);
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

	isMinePullRequests = () => this.currentButton === this._mine;
	isToApprovePullRequests = () => this.currentButton === this._toApprove;
	isAllPullRequests = () => this.currentButton === this._all;

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

	getImageWithTodayStr = async ({ id }) => `data:image/png;base64,${await getGraphAvatar({ id })}`;

	getPullRequests = async () => {
		const { all, toApprove, mine } = await this.vstsService.getPullRequests();
		this.pullRequests = await this.withCurrentMemberVote(all);
		this.pullRequests.sort((pr1, pr2) => moment(pr1.creationDate).diff(pr2.creationDate));
		this.toApprovePullRequests = toApprove.map(pr => pr.pullRequestId);
		this.minePullRequests = mine.map(pr => pr.pullRequestId);
	};

	logout = () => {
		removeCurrentDomain();
		removeOAuthToken();
		removeCurrentMember();
		window.location.reload();
	};

	// limit = 6;
	// loadMore = (last, inview) => {
	// 	console.log(last,inview);
	// 	if (last && inview) {
	// 		this.limit += 3;
	// 	}
	// };
}

mainModule.component("pullRequests", {
    controller: PullRequestsController,
    bindings: {
        "initialized": "&"
    },
    template
});
