angular.module('vstsChrome').component("member", {
    bindings: {
        memberSelected: "&",
        membersDisplay: "&",
        currentMember: "<"
    },
    controller: MemberController,
    controllerAs: "memberCtrl",
    templateUrl: "member/member.html",
    css: "member/member.css"
});

MemberController.$inject=['memberService'];
function MemberController(memberService) {
    var memberCtrl = this;
    memberCtrl.$onInit = function() {
    };

    memberCtrl.currentMember = memberService.getCurrentMember();
}