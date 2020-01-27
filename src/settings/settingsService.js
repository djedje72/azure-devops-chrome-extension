export const setCurrentDomain = (domain) => void localStorage.setItem("domain", JSON.stringify(domain));

export const getCurrentDomain = () => JSON.parse(localStorage.getItem("domain"));

export const getUrl = async() => getCurrentDomain().url;
export const getDomainUrl = async() => getCurrentDomain().domainUrl;
export const getDomainName = async() => getCurrentDomain().name;

export const removeCurrentDomain = () => void localStorage.removeItem("domain");

export const storeSetting = (key, value) => {
    const settings = getSettings();
    settings[key] = value;
    localStorage.setItem('settings', JSON.stringify(settings));
};

export const getSettings = () => JSON.parse(localStorage.getItem('settings')) || {};
