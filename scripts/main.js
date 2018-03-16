(function() {
    var app = angular.module( 'myApp', [] )
    
    const addCurrentNotification = (...args) => _processCurrentNotification("add", ...args);
    const deleteCurrentNotification = (...args) => _processCurrentNotification("delete", ...args);
    const _processCurrentNotification = (fn, notificationName) => {
        const currentNotificationsStorage = new Set(JSON.parse(localStorage.getItem("currentNotifications")));
        const result = currentNotificationsStorage[fn](notificationName);
        localStorage.setItem("currentNotifications", JSON.stringify(Array.from(currentNotificationsStorage)));
        return result;
    }

    angular.module('vstsChrome', ['angularCSS'])
    .config(function( $compileProvider ) {   
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
    })
    .run(function(vstsService, memberService) {
        vstsService.isInitialize().then(() => {
            chrome.alarms.create("refresh", {"when": Date.now() + 1000, "periodInMinutes": 2});
            
            chrome.alarms.create("resetBranches", {"when": Date.now(), "periodInMinutes": 60});

            const branches = {};
            const branchPrefix = "refs/heads/";
            
            function getNotificationName(suggestion) {
                const repositoryId = suggestion.repositoryId;
                const sourceBranch = suggestion.properties.sourceBranch.replace(branchPrefix, "");
                const targetBranch = suggestion.properties.targetBranch.replace(branchPrefix, "");
                return `${repositoryId}|${sourceBranch}|${targetBranch}`;
            }
            chrome.alarms.onAlarm.addListener(function(alarm) {
                if(alarm.name === "refresh") {
                    if(memberService.getCurrentMember()) {
                        vstsService.getPullRequests();
                        const {enableNotifications} = JSON.parse(localStorage.getItem("settings")) || {};
                        if (enableNotifications) {
                            vstsService.getSuggestionForUser().then((suggestions) => suggestions.filter((s)=> s)).then((suggestions) => {
                                let manifest = chrome.runtime.getManifest();
                                const notificationBody = {
                                    iconUrl: manifest.icons["128"],
                                    type: 'basic',
                                    title: "Create new Pull Request",
                                    requireInteraction: true
                                };
    
                                let suggestionsToKeep = [];
                                suggestions.forEach((suggestion) => {
                                    if(!branches[suggestion.properties.sourceBranch]) {
                                        let notificationStr = localStorage.getItem("notification");
                                        let createNotification = true;
                                        const notificationName = getNotificationName(suggestion);
                                        suggestionsToKeep.push(notificationName)
    
                                        if (notificationStr !== null) {
                                            const notification = JSON.parse(notificationStr);
                                            let closedNotification = notification.closed;
                                            if (closedNotification) {
                                                const notificationTime = closedNotification[notificationName];
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
                                            const sourceRepositoryName = suggestion.properties.sourceRepository.name;
                                            const sourceBranch = suggestion.properties.sourceBranch.replace(branchPrefix, "");
                                            const targetBranch = suggestion.properties.targetBranch.replace(branchPrefix, "");
                                            let options = Object.assign(notificationBody, {
                                                message: 
                                                    `${sourceRepositoryName.toUpperCase()}\n${sourceBranch} -> ${targetBranch}`
                                            });
                                            if (addCurrentNotification(getNotificationName(suggestion))) {
                                                chrome.notifications.create(getNotificationName(suggestion), options, (id) => {
                                                    branches[id] = suggestion;
                                                });
                                            }
                                        }
                                    }
                                });

                                
                                let notificationStr = localStorage.getItem("notification");
                                if (notificationStr) {
                                    const notification = JSON.parse(notificationStr);
                                    Object.keys(notification.closed).forEach((key) => {
                                        if (!suggestionsToKeep.includes(key)) {
                                            delete notification.closed[key];
                                        }
                                    });
                                    localStorage.setItem("notification", JSON.stringify(notification));
                                }
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
                    const notificationName = getNotificationName(suggestion);
                    if (deleteCurrentNotification(notificationName)) {
                        chrome.tabs.create({url: `${suggestion.remoteUrl}/pullrequestcreate?sourceRef=${sourceBranch}&targetRef=${targetBranch}`, active: false}, () => chrome.notifications.clear(clickId));
                    }
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

                    const notificationName = getNotificationName(suggestion);
                    deleteCurrentNotification(notificationName);

                    let closedNotification = notification.closed;
                    if (!closedNotification) {
                        closedNotification = {};
                        notification.closed = closedNotification;
                    }
                    closedNotification[notificationName] = new Date().getTime();
                    localStorage.setItem("notification", JSON.stringify(notification));
                }
            });
        });
    });
})();