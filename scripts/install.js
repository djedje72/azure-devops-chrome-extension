chrome.runtime.onInstalled.addListener(({previousVersion}) => {
    switch(previousVersion) {
        case "1.3.2":
        case "1.4.1": {
            const settings = JSON.parse(localStorage.getItem("settings")) || {};
            settings.enableNotifications = true;
            localStorage.setItem("settings", JSON.stringify(settings));
            break;
        }
        default: break;
    }
});