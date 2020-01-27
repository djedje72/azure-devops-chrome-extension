import "./ui-dark-mode.scss";
import template from "./ui-dark-mode.html";
import {mainModule} from "index";
import {getSettings, storeSetting} from "settings/settingsService.js";

class UiDarkModeController{
    static $inject=[];
    constructor() {
    }

    $onInit = () => {
		const { darkMode } = getSettings();
        this.isDarkMode = darkMode;
    };

	toggleMode = () => {
		const { darkMode } = getSettings();
		storeSetting("darkMode", !darkMode);
	};
}

mainModule.component("uiDarkMode", {
    bindings: {
        "onClick": "&"
    },
    controller: UiDarkModeController,
    template
});
