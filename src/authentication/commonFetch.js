export default async({url, params, ...obj}, authorization) => {
    const headers = new Headers();
    headers.append("Authorization", authorization);
    const urlToUse = `${url}${params ? `?${Object.entries(params).map(([k,v]) => `${k}=${v}`).join("&")}`:""}`
    const result = await (await fetch(urlToUse, {
        ...obj,
        headers
    })).json();
    return result;
}