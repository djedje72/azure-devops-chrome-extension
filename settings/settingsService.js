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

        function setCurrentDomain(domain) {
            currentDomain = domain;
            localStorage.setItem("currentDomain", JSON.stringify(currentDomain));
        }

        function getCurrentDomain() {
            return currentDomain;
        }

        function removeCurrentDomain() {
            localStorage.removeItem("currentDomain");
        }

        return {
            getCurrentDomain: getCurrentDomain,
            setCurrentDomain: setCurrentDomain,
            removeCurrentDomain: removeCurrentDomain
        };
    }
})();