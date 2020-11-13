import "./filter-project.scss";
import template from "./filter-project.html";
import {mainModule} from "../index";
import {getSettings, storeSetting} from "settings/settingsService.js";

class FilterProjectController{
    static $inject=['vstsService'];
    constructor(vstsService) {
        this.vstsService = vstsService;
    }

    _settingField = "disabledProjects";

    isDarkMode = () => getSettings().darkMode;

    $onInit = async() => {
        this.projects = (await this.getProjects())
            .map(({name, description, id}) => ({name, description, id}))
            .map((project) => ({...project, isChecked: this.isChecked(project.id)}));

        this.sortProjects();
        this.allChecked = this.areAllChecked();
    };

    areAllChecked = () => this.projects.every(({isChecked}) => isChecked);

    isChecked = (projectId) => {
        const {[this._settingField]: disabledProjects} = getSettings();
        return !(disabledProjects || []).includes(projectId);
    };

    sortProjects = () => this.projects.sort((a,b) => {
        let result;
        if (a.isChecked === b.isChecked) {
            return a.name.localeCompare(b.name);
        }
        if (a.isChecked) {
            return -1;
        }
        return 1;
    });

    getProjects = async() => await this.vstsService.getProjects();

    checked = (project) => {
        project.isChecked = !project.isChecked;
        const {[this._settingField]: disabledProjects} = getSettings();
        const uniqueDisabledProjects = new Set(disabledProjects);
        if (project.isChecked) {
            uniqueDisabledProjects.delete(project.id);
        } else {
            uniqueDisabledProjects.add(project.id);
        }
        this.sortProjects();
        this.storeSetting(this._settingField, [...uniqueDisabledProjects]);
        this.allChecked = project.isChecked && this.areAllChecked();
    };

    getCheckboxClass = (isChecked) => [
        this.isDarkMode() ? "fas" : "far",
        `fa${isChecked ? "-check": ""}-square`
    ];

    storeSetting = (...args) => {
        storeSetting(...args);
        this.onChange({});
    };

    toggleAll = () => {
        this.allChecked = !this.allChecked;
        this.projects.forEach(project => {
            project.isChecked = this.allChecked;
        })
        if (this.allChecked) {
            this.storeSetting(this._settingField, []);
        } else {
            this.storeSetting(this._settingField, this.projects.map(({id}) => id));
        }
    };
}

mainModule.component("filterProject", {
    controller: FilterProjectController,
    bindings: {
        "onChange": "&"
    },
    template
});
