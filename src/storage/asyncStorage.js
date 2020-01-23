export const setAsyncItem = async(key, value) => {
    await null;
    return localStorage.setItem(key, JSON.stringify(value));
};

export const addAsyncItem = async(itemKey, key, value) => {
    await null;
    const item = JSON.parse(localStorage.getItem(itemKey)) || {};
    item[key] = value;
    return localStorage.setItem(itemKey, JSON.stringify(item));
};

export const getAsyncItem = async(key) => {
    await null;
    return JSON.parse(localStorage.getItem(key));
};