import "./filter.css";
import template from "./filter.html";
import {mainModule} from "../index.js";

class FilterController{
    static $inject=['vstsService'];
    constructor(vstsService) {
        this.vstsService = vstsService;
    }

    $onInit = async() => {
        this.projects = (await this.getProjects())
            .map(({name, id}) => ({name, id}))
            .sort((a,b) => a.name.localeCompare(b.name));
    };

    getProjects = async() => await this.vstsService.getProjects();
}

mainModule.component("filter", {
    controller: FilterController,
    template
});
