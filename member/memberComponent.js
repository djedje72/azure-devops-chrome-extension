(function() {
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
            const currentTeams = memberCtrl.currentMember.teams;
            const index = members.findIndex(member => member.id === memberCtrl.currentMember.id);
            const {teams} = members[index];
            if (currentTeams.length !== teams.length
                || !currentTeams.every((currentTeam) => teams.findIndex(team => team === currentTeam) !== -1)) {
                console.log("refreshing teams...");
                memberService.setCurrentMember(Object.assign(memberCtrl.currentMember, {teams}));
                window.location.reload();
            }
            memberCtrl.members = members;
        });
    }
})();