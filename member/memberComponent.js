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
    });

    MemberController.$inject=['memberService', 'vstsService'];
    function MemberController(memberService, vstsService) {
        var memberCtrl = this;
        memberCtrl.$onInit = function() {
            memberCtrl.clickSelectUser = function() {
                if(memberCtrl.members.length > 0) {
                    memberService.toggleMembers();
                    if(memberService.isMembersShown()) {
                        memberCtrl.membersDisplay({});
                    }
                }
            };

            memberCtrl.selectMember = function(member) {
                memberService.hideMembers();
                memberCtrl.currentMember = member;
                memberService.setCurrentMember(member);
                memberCtrl.memberSelected({"member": member});
            }

            memberCtrl.isMembersShown = function() {
                return memberService.isMembersShown();
            }

            memberCtrl.members = [];
        };
        
        memberCtrl.currentMember = memberService.getCurrentMember();

        vstsService.getTeamMembers().then(function(members) {
            memberCtrl.members = members;
        });
    }
})();