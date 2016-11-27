(function() {
    angular.module('vstsChrome').service("settingsService", SettingsService);

    SettingsService.$inject=[];
    function SettingsService() {
        var currentDomain = null;
        var currentDomainStr = localStorage.getItem("currentDomain");
        if(currentDomainStr !== null) {
            try{
                currentDomain = JSON.parse(currentDomainStr);
            } catch(e) {
                localStorage.removeItem("currentDomain");
                currentDomain = null;
            }
        } else {
            currentDomain = null;
        }

        function setcurrentDomain(member) {
            currentDomain = member;
            localStorage.setItem("currentDomain", JSON.stringify(currentDomain));
        }

        function getcurrentDomain() {
            return currentDomain;
        }

        return {
            getcurrentDomain: getcurrentDomain,
            setcurrentDomain: setcurrentDomain
        };
    }
})();