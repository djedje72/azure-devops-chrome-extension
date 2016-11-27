(function() {
    angular.module('vstsChrome').component("settings", {
        controller: SettingsController,
        controllerAs: "settingsCtrl",
        templateUrl: "settings/settings.html",
        css: "settings/settings.css"
    });

    SettingsController.$inject=['vstsService', 'settingsService'];
    function SettingsController(vstsService, settingsService) {
        var settingsCtrl = this;
        settingsCtrl.changeCredentials = function() {
            vstsService.setCredentials({
                name: settingsCtrl.name,
                mail: settingsCtrl.mail,
                accessKey: settingsCtrl.accessKey,
            });
        }
        settingsCtrl.showSettings = true;
        var currentDomain = settingsService.getCurrentDomain();
        if(currentDomain) {
            settingsCtrl.showSettings = false;
        }
    }
})();