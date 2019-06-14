chrome.runtime.onInstalled.addListener(({previousVersion, reason, ...others}) => {
    let manifest = chrome.runtime.getManifest();
    const newVersion = manifest.version;
    const notificationBody = {
        iconUrl: manifest.icons["128"],
        type: 'basic',
        title: `${newVersion} UPDATE`
    };

    if (reason === "update") {
        migrateToDevAzureDomain();
    }

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
        case "1.10.0": {
            chrome.notifications.create({
                ...notificationBody,
                message: [
                    "- Sort PullRequests by creation date descending",
                    "- Add PullRequest duration"
                ].join("\n")
            });
        }
        default: break;
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
                    item[k] = v.replace(/(:\/\/)(.*)\.visualstudio.com(\/DefaultCollection)?/, "$1dev.azure.com/$2");
                });
            localStorage.setItem(itemKey, JSON.stringify(item));
        }
    });
}