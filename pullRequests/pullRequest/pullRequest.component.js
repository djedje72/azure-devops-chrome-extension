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

    $onInit = async() => {
		this.pullRequest = await this.vstsService.getFullPullRequest(this.pullRequest);
		this.$rootScope.$digest();
	};

	_repo = faker.lorem.word();
	getRepo = pr => this._repo;//	pr.title;

	_title = faker.lorem.sentence();
	getTitle = () => this._title;

	_from = faker.lorem.word();
	getBranchMerge = () => `feature/${this._from} to ${this.pullRequest.targetRefName.replace('refs/heads/', '')}`;

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
        "pullRequest": "<"
    },
    template
});
