import {removeCurrentDomain} from "./settingsService.js";
import {mainModule} from "../index.js";
import "./settings.scss";
import template from "./settings.html";

class SettingsController{
    static $inject=['vstsService', '$rootScope'];
    constructor(vstsService, $rootScope) {
        this.vstsService = vstsService;
        this.$rootScope = $rootScope;
    }

    hasError = false;
    isInitialize = true;
    isLoading = false;

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

    canValidate = () => this.name && (!this.usePat || this.pat);

    changeCredentials = async() => {
        await this.vstsService.setCredentials({
            name: this.name,
            pat: this.pat,
        });
        try {
            this.isLoading = true;
            this.hasError = false;
            this.$rootScope.$digest();
            await this.vstsService.getProjects();
            this.hasError = false;
            this.setInitialized();
        } catch (e) {
            this.hasError = true;
        } finally {
            this.isLoading = false;
        }
        this.$rootScope.$digest();
    }

    setInitialized = (shouldInit) => {
        this.initialized({shouldInit});
        if (!shouldInit) {
            this.isInitialize = true;
        }
    }

    usePatValue = () => !!this.pat;
    usePatChange = () => {
        if (!this.usePat) {
            this.pat = undefined;
        }
    }
}

mainModule.component("settings", {
    controller: SettingsController,
    bindings: {
        "initialized": "&",
        "inProgress": "&"
    },
    template
});
