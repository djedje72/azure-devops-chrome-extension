import {authFetch} from "../authentication/index";

const params = {
    "api-version":"5.1-preview"
};

export const getDescriptor = async(id) => (await authFetch({
    "url": `https://vssps.dev.azure.com/axafrance/_apis/graph/descriptors/${id}`,
    params
})).value;
