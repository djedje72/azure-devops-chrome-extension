export default () => {
    const defer = {};
    const promise = new Promise((resolve, reject) => {
        defer.resolve = resolve;
        defer.reject = reject;
    });
    promise.catch(e => console.error(e));
    defer.promise = promise;
    return defer;
};
