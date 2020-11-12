import {getCurrentDomain, setCurrentDomain} from "../../settings/settingsService";

export const getBasicHeader = () => {
    const {pat} = getCurrentDomain();
    return btoa(`:${pat || ""}`);
};

export const removePat = () => {
    setCurrentDomain({...getCurrentDomain(), "pat":undefined});
}
