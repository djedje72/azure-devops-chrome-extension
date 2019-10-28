import {getGraphAvatar} from "../../member/memberService.js";

import {mainModule} from "../../index.js";

class PullRequestReviewersController{
    static $inject=["$timeout"];
    constructor($timeout) {
        this.$timeout = $timeout;
    }

    $onInit = async() => this.$timeout(async() => {
        await Promise.all(this.reviewers.map(async reviewer => {
            reviewer.image = await getGraphAvatar(reviewer);
        }));
    });

    style = ({image}) => image && ({
        "background-image": `url("data:image/png;base64,${image}")`
    });
}

mainModule.component("pullRequestReviewers", {
    controller: PullRequestReviewersController,
    bindings: {
        "reviewers": "<"
    },
    templateUrl: "pullRequest/pullRequest-reviewers/pullRequestReviewers.html",
    css: "pullRequest/pullRequest-reviewers/pullRequestReviewers.css"
});
