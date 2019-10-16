import {
    init,
    getPullRequests, setCredentials, getProjects,
    getSuggestionForUser, isInitialize, isLoginInitialize
} from "./vsts.pure.js";
import {mainModule} from "../index.js";

class VstsService {
    $inject = [];
    constructor() {
        init();
    }

    getPullRequests = getPullRequests;

    setCredentials = setCredentials;

    getProjects = getProjects;

    isInitialize = isInitialize;

    isLoginInitialize = isLoginInitialize;

    getSuggestionForUser = getSuggestionForUser;
}

mainModule.service("vstsService", VstsService);
