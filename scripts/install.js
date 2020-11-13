import changelog from "./changelog";

const enableNotification = () => {
    const settings = JSON.parse(localStorage.getItem("settings")) || {};
    settings.enableNotifications = true;
    localStorage.setItem("settings", JSON.stringify(settings));
};

const defaultDarkMode = () => {
    const settings = JSON.parse(localStorage.getItem("settings")) || {};
    if (settings.darkMode === undefined) {
        settings.darkMode = true;
    }
    localStorage.setItem("settings", JSON.stringify(settings));
};

browser.runtime.onInstalled.addListener(({previousVersion, reason, ...others}) => {
    let manifest = browser.runtime.getManifest();
    const newVersion = manifest.version;
    const notificationBody = {
        iconUrl: manifest.icons["128"],
        type: 'basic',
        title: `${newVersion} UPDATE`
    };

    defaultDarkMode();

    switch (reason) {
        case "install": {
            enableNotification();
            break;
        }
        case "update": {
            migrateToDevAzureDomain();
            break;
        }
        default: break;
    }

    const message = changelog[newVersion];

    if (message) {
        browser.notifications.create({
            ...notificationBody,
            "message": message.join("\n")
        });
    }
});

const migrateToDevAzureDomain = () => {
    Object.entries({
        "currentMember": ["imageUrl"],
        "currentDomain": [
            "domainUrl",
            "vstsUrl"
        ]
    }).forEach(([itemKey, fields]) => {
        const item = JSON.parse(localStorage.getItem(itemKey));
        if (item) {
            Object.entries(item)
                .filter(([k]) => fields.includes(k))
                .forEach(([k, v]) => {
                    item[k] = v
                        .replace(/\/DefaultCollection/, "")
                        .replace(/(:\/\/)(.*)\.visualstudio.com/, "$1dev.azure.com/$2");
                });
            localStorage.setItem(itemKey, JSON.stringify(item));
        }
    });
}