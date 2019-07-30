export const setCurrentDomain = (domain) => {
    chrome.storage.local.set({domain})
};

export const getCurrentDomain = async() => new Promise(resolve => {
    chrome.storage.local.get("domain", ({domain}) => resolve(domain));
});

export const  removeCurrentDomain = () => {
    chrome.storage.local.remove("domain");
};
