(function() {
    angular.module('vstsChrome').service("memberService", MemberService);

    MemberService.$inject=[];
    function MemberService() {
        var currentMember = null;
        var currentMemberStr = localStorage.getItem("currentMember");
        if(currentMemberStr !== null) {
            try{
                currentMember = JSON.parse(currentMemberStr);
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

        return {
            getCurrentMember: getCurrentMember,
            setCurrentMember: setCurrentMember
        };
    }
})();