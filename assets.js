import "@fortawesome/fontawesome-free/css/all.min.css";

import "angular";
import moment from "moment";
window.moment = moment;
import faker from "faker";
window.faker = faker;

window.browser = (() => window.msBrowser || window.browser || window.chrome)();