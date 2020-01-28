import {getCurrentMember} from "member/memberService.js";
import {mainModule} from "../../index.js";
import template from "./pullRequest.html";
import "./pullRequest.css";
import {getDomainUrl} from "settings/settingsService.js";

class PullRequestController{
	static $inject = ["vstsService", "$rootScope"];
    constructor(vstsService, $rootScope) {
		this.vstsService = vstsService;
		this.$rootScope = $rootScope;
	}

	_isInitialized = false;

	$onChanges = async({isVisible}) => {
		if(!this._isInitialized && isVisible.currentValue) {
			this._isInitialized = true;
			this.pullRequest = await this.vstsService.getFullPullRequest(this.pullRequest);
			await this.withCurrentMemberVote(this.pullRequest);
			this.$rootScope.$digest();
		}
	};

	withCurrentMemberVote = async pr => {
		const currentMember = await getCurrentMember();
		if (currentMember) {
			const currentMemberReviews = pr.reviewers.filter(
				reviewer => reviewer.uniqueName === currentMember.emailAddress
			);
			if (currentMemberReviews.length > 0) {
				pr.currentMemberVote = currentMemberReviews[0].vote;
			}
		}
	};

	reviewClass = () => ({
		'review-rejected': this.pullRequest.currentMemberVote === -10,
		'review-waiting': this.pullRequest.currentMemberVote === -5,
		'autocomplete-active': this.pullRequest.autoCompleteSetBy,
		'draft-active': this.pullRequest.isDraft
    });

	durationToDisplay = () => moment(this.pullRequest.creationDate).fromNow();

	_redirectUri = async() => {
		try {
			const { pullRequestId, repository } = this.pullRequest;
			const {
				"name": repoName,
				"project": {"name": projectName}
			} = repository;
			return `${await getDomainUrl()}/${projectName}/_git/${repoName}/pullRequest/${pullRequestId}`;
		} catch {}
	}

	redirect = async() => {
		browser.tabs.create({ url: await this._redirectUri(), active: false });
    };

    policiesDetails = () => {
        const {policies} = this.pullRequest.evaluations || {};
		let result = "";
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
}

mainModule.component("pullRequest", {
    controller: PullRequestController,
    bindings: {
		"pullRequest": "<",
		"isVisible": "<"
    },
    template
});
