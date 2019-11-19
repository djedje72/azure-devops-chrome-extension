import {getGraphAvatar} from "../../member/memberService.js";

import {mainModule} from "../../index.js";
import template from "./pullRequestCreator.html";
import "./pullRequestCreator.css";
import faker from "faker";

class PullRequestCreatorController{
    static $inject=["$timeout"];
    constructor($timeout) {
        this.$timeout = $timeout;
    }

    $onInit = async() => this.$timeout(async() => {
        this.creator.image = await getGraphAvatar(this.creator);
    });

    _image = faker.internet.avatar();
    style = () => this.creator.image && ({
        // "background-image": `url("data:image/png;base64,${this.creator.image}")`
        "background-image": `url(${this._image})`,
        "background-size": "50px 50px"
    });
}

mainModule.component("pullRequestCreator", {
    controller: PullRequestCreatorController,
    bindings: {
        "creator": "<"
    },
    template
});
