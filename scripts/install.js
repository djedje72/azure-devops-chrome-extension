const enableNotification = () => {
    const settings = JSON.parse(localStorage.getItem("settings")) || {};
    settings.enableNotifications = true;
    localStorage.setItem("settings", JSON.stringify(settings));
};

chrome.runtime.onInstalled.addListener(({previousVersion, reason, ...others}) => {
    let manifest = chrome.runtime.getManifest();
    const newVersion = manifest.version;
    const notificationBody = {
        iconUrl: manifest.icons["128"],
        type: 'basic',
        title: `${newVersion} UPDATE`
    };

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

    let message;
    switch(newVersion) {
        case "2.3.0": {
            message = [
                "Use new Azure DevOps icons"
            ]
            break;
        }
        case "2.2.2": {
            enableNotification();
            message = [
                "Default enable notifications. You can disable them in the settings."
            ]
            break;
        }
        case "2.2.1": {
            message = [
                "Handle avatar without azure devops cookie"
            ];
            break;
        }
        case "2.1.2": {
            message = [
                "Handle people with multiple email addresses"
            ];
            break;
        }
        case "2.1.1": {
            message = [
                "Use domain profile instead of global profile"
            ];
            break;
        }
        case "2.1.0": {
            message = [
                "Add fast card for auto-complete"
            ];
            break;
        }
        case "2.0.0": {
            message = [
                "Use OAuth2 flow instead of Basic Auth"
            ];
            break;
        }
        case "1.10.0": {
            message = [
                "- Sort PullRequests by creation date descending",
                "- Add PullRequest duration"
            ];
            break;
        }
        case "1.4.3": {
            message = ["- Fix 404 issues"];
            break;
        }
        default: break;
    }

    if (message) {
        chrome.notifications.create({
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