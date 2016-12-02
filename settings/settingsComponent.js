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
        settingsCtrl.hasError = false;

        settingsCtrl.canValidate = function() {
            return settingsCtrl.vstsName && settingsCtrl.mail && settingsCtrl.accessKey;
        };

        settingsCtrl.loading = false;

        settingsCtrl.changeCredentials = function() {
            settingsCtrl.loading = true;
            vstsService.setCredentials({
                vstsName: settingsCtrl.vstsName,
                mail: settingsCtrl.mail,
                accessKey: settingsCtrl.accessKey,
            }).then(function(){
                settingsCtrl.hasError = false;
            }, function() {
                settingsCtrl.hasError = true;
            }).finally(function() {
                settingsCtrl.loading = false;
            });
        }

        settingsCtrl.isInitialize = false;

        vstsService.isInitialize().then(function() {
            settingsCtrl.isInitialize = true;
        });
    }
})();