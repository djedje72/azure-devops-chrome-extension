(function() {
    angular.module('vstsChrome').component("settings", {
        controller: SettingsController,
        controllerAs: "settingsCtrl",
        templateUrl: "settings/settings.html",
        css: "settings/settings.css"
    });

    SettingsController.$inject=['vstsService'];
    function SettingsController(vstsService) {
        var settingsCtrl = this;
        settingsCtrl.hasError = false;

        settingsCtrl.canValidate = function() {
            return settingsCtrl.name;
        };

        settingsCtrl.loading = false;

        settingsCtrl.changeCredentials = function() {
            settingsCtrl.loading = true;
            vstsService.setCredentials({
                name: settingsCtrl.name,
            }).then(function(){
                settingsCtrl.isInitialize = true;
                settingsCtrl.hasError = false;
            }, function() {
                settingsCtrl.hasError = true;
            }).finally(function() {
                settingsCtrl.loading = false;
            });
        }

        settingsCtrl.isInitialize = true;

        vstsService.isLoginInitialize().catch(function() {
            settingsCtrl.isInitialize = false;
        });
    }
})();