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

    MemberController.$inject=['memberService', 'vstsService', 'settingsService'];
    function MemberController(memberService, vstsService, settingsService) {
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
            let currentMember = memberCtrl.currentMember;
            if (!currentMember) {
                const {basic} = settingsService.getCurrentDomain();
                const [login] = atob(basic).split(":");
                currentMember = members.find(({uniqueName}) => uniqueName === login);
                memberService.setCurrentMember(currentMember);
                window.location.reload();
            }

            if (currentMember) {
                const currentTeams = currentMember.teams;
                const index = members.findIndex(member => member.id === currentMember.id);
                const {teams} = members[index];
                if (currentTeams.length !== teams.length
                    || !currentTeams.every((currentTeam) => teams.findIndex(team => team === currentTeam) !== -1)) {
                    console.log("refreshing teams...");
                    memberService.setCurrentMember(Object.assign(currentMember, {teams}));
                    window.location.reload();
                }

            }
            memberCtrl.members = members;
        });
    }
})();