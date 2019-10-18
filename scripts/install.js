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

    let message;
    switch(newVersion) {
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