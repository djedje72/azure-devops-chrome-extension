import {removeCurrentDomain} from "./settingsService.js";
import {mainModule} from "../index.js";

class SettingsController{
    static $inject=['vstsService', '$rootScope'];
    constructor(vstsService, $rootScope) {
        this.vstsService = vstsService;
        this.$rootScope = $rootScope;
    }

    hasError = false;
    loading = false;
    isInitialize = true;

    $onInit = async() => {
        try {
            await this.vstsService.isLoginInitialize();
            this.setInitialized();
        } catch(e) {
            removeCurrentDomain();
            this.setInitialized(true);
            this.isInitialize = false;
            this.$rootScope.$digest();
        }
    };

    _keys = {
        "enter": 13
    };
    keyPress = event => {
        switch (event.which) {
            case this._keys.enter: {
                this.canValidate() && this.changeCredentials();
                break;
            }
            default: break;
        }
    };

    canValidate = () => this.name;

    changeCredentials = async() => {
        this.loading = true;
        await this.vstsService.setCredentials({
            name: this.name,
        });
        try {
            await this.vstsService.getProjects();
            this.hasError = false;
            this.loading = false;
            this.setInitialized();
        } catch (e) {
            this.hasError = true;
        }
        this.$rootScope.$digest();
    }

    setInitialized = (shouldInit) => {
        this.initialized({shouldInit});
        if (!shouldInit) {
            this.isInitialize = true;
        }
    }
}

mainModule.component("settings", {
    controller: SettingsController,
    bindings: {
        "initialized": "&",
        "inProgress": "&"
    },
    templateUrl: "settings/settings.html",
    css: "settings/settings.css"
});
