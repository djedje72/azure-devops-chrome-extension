import "./filter.css";
import template from "./filter.html";
import {mainModule} from "./index";

class FilterController{
    static $inject=[];
    constructor() {
    }

    $onInit = () => {};
}

mainModule.component("filter", {
    controller: FilterController,
    template
});
