import {getGraphAvatar} from "../../member/memberService.js";

import {mainModule} from "../../index.js";

class PullRequestCreatorController{
    static $inject=["$timeout"];
    constructor($timeout) {
        this.$timeout = $timeout;
    }

    $onInit = async() => this.$timeout(async() => {
        this.creator.image = `data:image/png;base64,${await getGraphAvatar(this.creator)}`;
    });
}

mainModule.component("pullRequestCreator", {
    controller: PullRequestCreatorController,
    bindings: {
        "creator": "<"
    },
    templateUrl: "pullRequest/pullRequest-creator/pullRequestCreator.html",
    css: "pullRequest/pullRequest-creator/pullRequestCreator.css"
});
