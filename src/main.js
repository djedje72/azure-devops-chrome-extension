if (!browser.alarms) {
    browser.alarms = {
        "create": () => {},
        "onAlarm": {
            "addListener": () => {}
        },
        "onClicked": {
            "addListener": () => {}
        },
        "onDeleted": {
            "addListener": () => {}
        }
    };
}
if (!browser.browserAction) {
    browser.browserAction = {
        "setBadgeText": () => {},
        "setBadgeBackgroundColor": () => {}
    };
}
if (!browser.notifications) {
    browser.notifications = {
        "onClicked": {
            "addListener": () => {}
        },
        "onClosed": {
            "addListener": () => {}
        }
    }
}
export const mainModule = angular.module('vstsChrome', []);
mainModule.config(($compileProvider) => {
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):|data:image\//);
});
