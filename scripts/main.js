(function() {
    angular.module('vstsChrome', ['angularCSS']).run(function(vstsService) {
        chrome.alarms.create("refresh", {"when":Date.now() + 1000, "periodInMinutes":2});

        chrome.alarms.onAlarm.addListener(function(alarm) {
            if(alarm.name === "refresh") {
                vstsService.getPullRequests();
            }
        });
    });
})();