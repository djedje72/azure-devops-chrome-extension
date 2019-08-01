import {getCurrentMember} from "./memberService.js";

angular.module('vstsChrome').component("member", {
    bindings: {
    },
    controller: MemberController,
    controllerAs: "memberCtrl",
    templateUrl: "member/member.html",
    css: "member/member.css"
});

MemberController.$inject=['$rootScope'];
function MemberController($rootScope) {
    var memberCtrl = this;
    memberCtrl.$onInit = function() {
    };

    (async() => {
        memberCtrl.currentMember = await getCurrentMember();
        memberCtrl.avatar = memberCtrl.currentMember.coreAttributes.Avatar.value;
        $rootScope.$digest();
    })();
}