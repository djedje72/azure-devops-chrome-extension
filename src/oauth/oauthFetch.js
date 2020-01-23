import token from "./index.js";

export default async({url, params, ...obj}) => {
    const headers = new Headers();
    headers.append("Authorization", `Bearer ${(await token()).access_token}`);
    const urlToUse = `${url}${params ? `?${Object.entries(params).map(([k,v]) => `${k}=${v}`).join("&")}`:""}`
    const result = await (await fetch(urlToUse, {
        ...obj,
        headers
    })).json();
    return result;
};
