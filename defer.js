export default () => {
    const defer = {};
    const promise = new Promise((resolve, reject) => {
        defer.resolve = resolve;
        defer.reject = reject;
    });
    defer.promise = promise;
    return defer;
};
