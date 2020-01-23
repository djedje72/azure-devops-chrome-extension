import {getGraphAvatar} from "../../member/memberService.js";

import {mainModule} from "../../index.js";
import template from "./pullRequestCreator.html";
import "./pullRequestCreator.css";

class PullRequestCreatorController{
    static $inject=["$timeout"];
    constructor($timeout) {
        this.$timeout = $timeout;
    }

    $onInit = async() => this.$timeout(async() => {
        this.creator.image = await getGraphAvatar(this.creator);
    });

    style = () => this.creator.image && ({
        "background-image": `url("data:image/png;base64,${this.creator.image}")`
    });
}

mainModule.component("pullRequestCreator", {
    controller: PullRequestCreatorController,
    bindings: {
        "creator": "<"
    },
    template
});
