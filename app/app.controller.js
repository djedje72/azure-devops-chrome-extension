import "../settings/settingsComponent.js";
import "../pullRequest/pullRequestComponent.js";
import {mainModule} from "../index.js";
class AppController{
    constructor($rootScope) {
        this.$rootScope = $rootScope;
    }

    $onInit = () => {
    };

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
    templateUrl: "app/app.html",
    css: "app/app.css"
});
