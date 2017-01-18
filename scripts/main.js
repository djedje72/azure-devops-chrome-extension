(function() {
    angular.module('vstsChrome', ['angularCSS']).run(function(vstsService, memberService) {
        chrome.alarms.create("refresh", {"when": Date.now() + 1000, "periodInMinutes": 2});
        
        chrome.alarms.create("resetBranches", {"when": Date.now(), "periodInMinutes": 60});

        const branches = {};
        chrome.alarms.onAlarm.addListener(function(alarm) {
            if(alarm.name === "refresh") {
                if(memberService.getCurrentMember()) {
                    vstsService.getPullRequests();
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
                                const branchPrefix = "refs/heads/";
                                let sourceBranch = suggestion.properties.sourceBranch.replace(branchPrefix, "");
                                let targetBranch = suggestion.properties.targetBranch.replace(branchPrefix, "");
                                let options = Object.assign(notificationBody, {
                                    message: `${sourceBranch} -> ${targetBranch}`
                                });
                                chrome.notifications.create(suggestion.properties.sourceBranch, options, (id) => {
                                    branches[id] = suggestion;
                                });
                            }
                        });
                    });
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
                const sourceBranch = suggestion.properties.sourceBranch.replace('refs/heads/', "");
                const targetBranch = suggestion.properties.targetBranch.replace('refs/heads/', "");
                chrome.tabs.create({url: `${suggestion.remoteUrl}/pullrequestcreate?sourceRef=${sourceBranch}&targetRef=${targetBranch}`, active: false}, () => chrome.notifications.clear(clickId));
            }
        });
    });
})();