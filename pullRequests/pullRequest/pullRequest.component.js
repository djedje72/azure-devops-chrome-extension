import {mainModule} from "../../index.js";
import template from "./pullRequest.html";
import "./pullRequest.css";

class PullRequestController{
	static $inject = ["vstsService", "$rootScope"];
    constructor(vstsService, $rootScope) {
		this.vstsService = vstsService;
		this.$rootScope = $rootScope;
    }

	isInitialized;
    $onInit = async() => {
		this.pullRequest = await this.vstsService.getFullPullRequest(this.pullRequest);
		this.$rootScope.$digest();
		this.isInitialized = true;
	};

	reviewClass = () => ({
		'review-rejected': this.pullRequest.currentMemberVote === -10,
		'review-waiting': this.pullRequest.currentMemberVote === -5,
		'autocomplete-active': this.pullRequest.autoCompleteSetBy,
		'draft-active': this.pullRequest.isDraft
    });

	durationToDisplay = () => moment(this.pullRequest.creationDate).fromNow();

	redirect = () => {
		var href = `${this.pullRequest.repository.remoteUrl.replace(/(:\/\/)([^/]*@)/, '$1')}/pullrequest/${this.pullRequest.pullRequestId}`;
		browser.tabs.create({ url: href, active: false });
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
        "pullRequest": "<"
    },
    template
});
