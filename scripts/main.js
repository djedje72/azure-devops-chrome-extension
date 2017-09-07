(function() {
    angular.module('vstsChrome', ['angularCSS']).run(function(vstsService, memberService) {
        vstsService.isInitialize().then(() => {
            chrome.alarms.create("refresh", {"when": Date.now() + 1000, "periodInMinutes": 2});
            
            chrome.alarms.create("resetBranches", {"when": Date.now(), "periodInMinutes": 60});

            const branches = {};
            const branchPrefix = "refs/heads/";
            
            chrome.alarms.onAlarm.addListener(function(alarm) {
                if(alarm.name === "refresh") {
                    if(memberService.getCurrentMember()) {
                        vstsService.getPullRequests();
                        const {enableNotifications} = JSON.parse(localStorage.getItem("settings") || {});
                        if (enableNotifications) {
                            vstsService.getSuggestionForUser().then((suggestions) => suggestions.filter((s)=> s)).then((suggestions) => {
                                let manifest = chrome.runtime.getManifest();
                                const notificationBody = {
                                    iconUrl: manifest.icons["128"],
                                    type: 'basic',
                                    title: "Create new Pull Request",
                                    requireInteraction: true
                                };
    
                                suggestions.forEach((suggestion) => {
                                    if(!branches[suggestion.properties.sourceBranch]) {
                                        const repositoryId = suggestion.repositoryId;
                                        const sourceBranch = suggestion.properties.sourceBranch.replace(branchPrefix, "");
                                        const targetBranch = suggestion.properties.targetBranch.replace(branchPrefix, "");
                                        let notificationStr = localStorage.getItem("notification");
                                        let createNotification = true;
    
                                        if (notificationStr !== null) {
                                            const notification = JSON.parse(notificationStr);
                                            let closedNotification = notification.closed;
                                            if (closedNotification) {
                                                const notificationTime = closedNotification[`${repositoryId}|${sourceBranch}|${targetBranch}`];
                                                if (notificationTime) {
                                                    const currentDate = new Date();
                                                    const notificationDate = new Date(notificationTime);
                                                    // add a day
                                                    notificationDate.setDate(notificationDate.getDate() + 1);
                                                    if (notificationDate > currentDate) {
                                                        createNotification = false;
                                                    }
                                                }
                                            }
                                        }
                                        if (createNotification) {
                                            let options = Object.assign(notificationBody, {
                                                message: `${sourceBranch} -> ${targetBranch}`
                                            });
                                            chrome.notifications.create(suggestion.properties.sourceBranch, options, (id) => {
                                                branches[id] = suggestion;
                                            });
                                        }
                                    }
                                });
                            });
                        }
                    }
                } else if (alarm.name === "resetBranches") {
                    chrome.notifications.getAll((currentNotifications) => {
                        Object.keys(branches).filter((branch) => !currentNotifications[branch]).forEach((key) => delete branches[key]);
                    });
                }
            });

            chrome.notifications.onClicked.addListener((clickId) => {
                let suggestion = branches[clickId];
                if(suggestion) {
                    const sourceBranch = suggestion.properties.sourceBranch.replace(branchPrefix, "");
                    const targetBranch = suggestion.properties.targetBranch.replace(branchPrefix, "");
                    chrome.tabs.create({url: `${suggestion.remoteUrl}/pullrequestcreate?sourceRef=${sourceBranch}&targetRef=${targetBranch}`, active: false}, () => chrome.notifications.clear(clickId));
                }
            });

            chrome.notifications.onClosed.addListener((clickId, byUser) => {
                if (byUser) {
                    let notificationStr = localStorage.getItem("notification");
                    let notification;
                    if (notificationStr !== null) {
                        notification = JSON.parse(notificationStr);
                    } else {
                        notification = {};
                    }
                    let suggestion = branches[clickId];
                    const repositoryId = suggestion.repositoryId;
                    const sourceBranch = suggestion.properties.sourceBranch.replace(branchPrefix, "");
                    const targetBranch = suggestion.properties.targetBranch.replace(branchPrefix, "");
                    let closedNotification = notification.closed;
                    if (!closedNotification) {
                        closedNotification = {};
                        notification.closed = closedNotification;
                    }
                    closedNotification[`${repositoryId}|${sourceBranch}|${targetBranch}`] = new Date().getTime();
                    localStorage.setItem("notification", JSON.stringify(notification));
                }
            });
        });
    });
})();