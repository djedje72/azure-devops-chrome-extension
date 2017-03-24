(function() {
    angular.module('vstsChrome').service("memberService", MemberService);

    MemberService.$inject=[];
    function MemberService() {
        var isShowMembers = false;
        var currentMember = null;
        var currentMemberStr = localStorage.getItem("currentMember");
        if(currentMemberStr !== null) {
            try{
                currentMember = JSON.parse(currentMemberStr);
                if(!currentMember.hasOwnProperty("teams")) {
                    throw new Error();
                }
            } catch(e) {
                localStorage.removeItem("currentMember");
                currentMember = null;
            }
        } else {
            currentMember = null;
        }

        function setCurrentMember(member) {
            currentMember = member;
            localStorage.setItem("currentMember", JSON.stringify(currentMember));
        }

        function getCurrentMember() {
            return currentMember;
        }

        function hideMembers() {
            isShowMembers = false;
        }

        function showMembers() {
            isShowMembers = true;
        }

        function toggleMembers() {
            isShowMembers = !isShowMembers;
        }

        function isMembersShown() {
            return isShowMembers;
        }

        return {
            getCurrentMember: getCurrentMember,
            setCurrentMember: setCurrentMember,
            hideMembers: hideMembers,
            showMembers: showMembers,
            toggleMembers: toggleMembers,
            isMembersShown: isMembersShown
        };
    }
})();