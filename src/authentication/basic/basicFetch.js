import commonFetch from "../commonFetch";
import {getBasicHeader} from "./index";

export default (obj) => commonFetch(obj, `Basic ${getBasicHeader()}`);