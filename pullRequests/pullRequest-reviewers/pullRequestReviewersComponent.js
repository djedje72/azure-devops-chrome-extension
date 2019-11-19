import {getGraphAvatar} from "../../member/memberService.js";

import {mainModule} from "../../index.js";
import template from "./pullRequestReviewers.html";
import "./pullRequestReviewers.css";

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

	isReviewerToDisplay = reviewer => reviewer.isRequired || reviewer.vote > 0;

    _image = faker.internet.avatar();
    style = ({image}) => image && ({
        // "background-image": `url("data:image/png;base64,${image}")`
        "background-image": `url(${this._image})`,
        "background-size": "30px 30px"
    });
}

mainModule.component("pullRequestReviewers", {
    controller: PullRequestReviewersController,
    bindings: {
        "reviewers": "<"
    },
    template
});
