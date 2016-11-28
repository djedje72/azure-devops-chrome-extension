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

        settingsCtrl.canValidate = function() {
            return settingsCtrl.vstsName && settingsCtrl.mail && settingsCtrl.accessKey;
        };

        settingsCtrl.changeCredentials = function() {
            vstsService.setCredentials({
                vstsName: settingsCtrl.vstsName,
                mail: settingsCtrl.mail,
                accessKey: settingsCtrl.accessKey,
            });
        }
        settingsCtrl.isInitialize = function() {
            return vstsService.isInitialize()
        };
    }
})();