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

    MemberController.$inject=['memberService', 'vstsService'];
    function MemberController(memberService, vstsService) {
        var memberCtrl = this;
        memberCtrl.$onInit = function() {
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
                memberService.setCurrentMember(member);
                memberCtrl.memberSelected({"member": member});
            }

            memberCtrl.members = [];
        };
        
        memberCtrl.currentMember = memberService.getCurrentMember();

        vstsService.getTeamMembers().then(function(members) {
            memberCtrl.members = members;
        });
    }
})();