import "./filter.css";
import template from "./filter.html";
import {mainModule} from "../index.js";

class FilterController{
    constructor() {
    }
}

mainModule.component("filter", {
    controller: FilterController,
    template
});
