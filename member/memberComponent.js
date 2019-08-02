import {getCurrentMember} from "./memberService.js";
import {mainModule} from "../index.js";

class MemberController {
    static $inject = ['$rootScope'];
    constructor($rootScope) {
        this.$rootScope = $rootScope;
    }

    $onInit = async() => {
        this.currentMember = await getCurrentMember();
        this.avatar = this.currentMember.coreAttributes.Avatar.value;
        this.$rootScope.$digest();
    };
}

mainModule.component("member", {
    bindings: {
    },
    controller: MemberController,
    controllerAs: "memberCtrl",
    templateUrl: "member/member.html",
    css: "member/member.css"
});
