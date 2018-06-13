chrome.runtime.onInstalled.addListener(({previousVersion, ...others}) => {
    let manifest = chrome.runtime.getManifest();
    const newVersion = manifest.version;
    const notificationBody = {
        iconUrl: manifest.icons["128"],
        type: 'basic',
        title: `${newVersion} UPDATE`
    };

    switch(previousVersion) {
        case "1.3.2":
        case "1.4.1": {
            const settings = JSON.parse(localStorage.getItem("settings")) || {};
            settings.enableNotifications = true;
            localStorage.setItem("settings", JSON.stringify(settings));
            break;
        }
    }

    switch(newVersion) {
        case "1.4.3": {
            chrome.notifications.create({
                ...notificationBody,
                message: "- Fix 404 issues"
            });
            break;
        }
        default: break;
    }
});