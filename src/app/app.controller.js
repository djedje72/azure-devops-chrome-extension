import "settings/settingsComponent.js";
import "../pullRequests/pullRequests.component.js";
import {mainModule} from "../index.js";
import "./app.css";
import template from "./app.html";
import {getSettings} from "settings/settingsService.js";

class AppController{
    constructor($rootScope) {
        this.$rootScope = $rootScope;
    }

    $onInit = () => {};
    isDarkMode = () => getSettings().darkMode;

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
