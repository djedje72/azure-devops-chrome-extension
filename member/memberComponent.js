(function() {
    angular.module('vstsChrome').component("member", {
        bindings: {
            members: "<",
            memberSelected: "&",
            membersDisplay: "&",
            currentMember: "<"
        },
        controller: MemberController,
        controllerAs: "memberCtrl",
        templateUrl: "member/member.html",
        css: "member/member.css"
    })

    MemberController.$inject=[];
    function MemberController() {
        var memberCtrl = this;
        memberCtrl.showUsers = false;

        memberCtrl.clickSelectUser = function() {
            if(memberCtrl.members.length > 0) {
                memberCtrl.showUsers = !memberCtrl.showUsers;
                if(memberCtrl.showUsers) {
                    memberCtrl.membersDisplay({});
                }
            }
        };

        memberCtrl.selectMember = function(member) {
            memberCtrl.showUsers = false;
            memberCtrl.memberSelected({"member": member});
        }
    }
})();