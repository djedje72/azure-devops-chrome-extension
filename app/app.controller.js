import "../settings/settingsComponent.js";
import "../pullRequests/pullRequests.component.js";
import {mainModule} from "../index.js";
import "./app.css";
import template from "./app.html";

class AppController{
    constructor($rootScope) {
        this.$rootScope = $rootScope;
    }

    $onInit = () => {
    };
	_getSettings = () => JSON.parse(localStorage.getItem('settings')) || {};
    isDarkMode = () => this._getSettings().darkMode;

    settingsInitialized = (shouldInit) => {
        this.shouldInitSettings = shouldInit;
        if (!shouldInit) {
            this.settingsOk = true;
        }
        this.$rootScope.$digest();
    };

    prInitialized = () => {
        this.prOk = true;
    };

    isLoading = () => !this.shouldInitSettings && !(this.settingsOk && this.prOk);
}

mainModule.component("app", {
    controller: AppController,
    template
});
