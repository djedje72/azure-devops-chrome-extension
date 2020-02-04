import {removeCurrentDomain} from "settings/settingsService.js";
import {removeCurrentMember, getGraphAvatar} from "../member/memberService.js";
import {removeOAuthToken} from "../oauth/index.js";
import {getSettings, storeSetting} from "settings/settingsService.js";

import {mainModule} from "../index.js";
import "./pullRequest-reviewers/pullRequestReviewersComponent";
import "./pullRequest-creator/pullRequestCreatorComponent";
import "./pullRequest";
import "../filter";

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
	displayMode;

	$onInit = () => {
		this.displayMode = this.displayModes.pullRequests;
		this.currentButton = this._toApprove;
		const { enableNotifications } = getSettings();
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
		this.togglePullRequests();
		this.pullRequests.forEach(pr => {
			pr.isVisible = true;
		});
	};

	fillToApprovePullRequests = () => {
		this.currentButton = this._toApprove;
		this.togglePullRequests();
		this.pullRequests.forEach(pr => {
			pr.isVisible = this.toApprovePullRequests.includes(pr.pullRequestId);
		});
	};

	fillMinePullRequests = () => {
		this.currentButton = this._mine;
		this.togglePullRequests();
		this.pullRequests.forEach(pr => {
			pr.isVisible = this.minePullRequests.includes(pr.pullRequestId);
		});
	};

	displayModes = {
		"pullRequests": "pullRequests",
		"filters": "filters",
		"settings": "settings"
	};

	togglePullRequests = () => {
		this.displayMode = this.displayModes.pullRequests;
	};
	toggleFilters = () => {
		this.displayMode = this.displayModes.filters;
	};
	toggleSettings = () => {
		this.displayMode = this.displayModes.settings;
	};

	isMinePullRequests = () => this.currentButton === this._mine;
	isToApprovePullRequests = () => this.currentButton === this._toApprove;
	isAllPullRequests = () => this.currentButton === this._all;

	toggleNotifications = () => {
		storeSetting('enableNotifications', this.enableNotifications);
	};

	getImageWithTodayStr = async ({ id }) => `data:image/png;base64,${await getGraphAvatar({ id })}`;

	getPullRequests = async () => {
        const {disabledProjects} = getSettings();
		const pullRequests = await this.vstsService.getPullRequests();
		const { all, toApprove, mine } = Object.fromEntries(
			Object
				.entries(pullRequests)
				.map(([name, value]) => [
					name,
					value.filter(({"repository": {project}}) => !(disabledProjects || []).includes(project.id))
				])
		);

		this.pullRequests = all;
		this.pullRequests.sort((pr1, pr2) => moment(pr1.creationDate).diff(pr2.creationDate));
		this.toApprovePullRequests = toApprove.map(pr => pr.pullRequestId);
		this.minePullRequests = mine.map(pr => pr.pullRequestId);

		this.$rootScope.$digest();
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
