(function() {
    angular.module('vstsChrome').service("spinnerService", SpinnerService);

    SpinnerService.$inject=[];
    function SpinnerService() {
        var loading = false;

        function hideLoading() {
            loading = false;
        }

        function showLoading() {
            loading = true;
        }
        return {
            hideLoading: hideLoading,
            showLoading: showLoading
        };
    }
})();