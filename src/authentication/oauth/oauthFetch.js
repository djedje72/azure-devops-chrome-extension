import token from "./index";
import commonFetch from "../commonFetch";

export default async(obj) => commonFetch(obj, `Bearer ${(await token()).access_token}`);
