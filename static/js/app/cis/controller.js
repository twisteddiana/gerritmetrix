/**
 * Created by diana on 21.12.2016.
 */

gerritmetrix.controller("cisCtrl",['$scope', '$http', '$state', 'SweetAlert', 'CI', '$location', function ($scope, $http, $state, SweetAlert, CI, $location) {
    $scope.title = "CIs";
    $scope.subtitle = "List";

    $scope.limit = 50;
    $scope.skip = 0;
    $scope.total_rows = 0;
    $scope.search_query = '';


    if (typeof $location.search().filter != 'undefined')
        $scope.search_query = $location.search().filter;

    if (typeof $location.search().page != 'undefined') {
        var page = parseInt($location.search().page);
        if (!isNaN(page)) {
            $scope.skip = (page - 1) * $scope.limit;
        }
    }

    $scope.generateQueryParams = function() {
        return {
            limit: $scope.limit,
            skip: $scope.skip,
            search: $scope.search_query
        };
    }

    $scope.getList = function() {
        CI.get($scope.generateQueryParams()).then(function(data) {
            $scope.authors = data.data.rows;
            $scope.total_rows = $scope.authors.length;
        })
    }

    $scope.$watch('search_query', function () {
        if ($scope.search_query != '')
            $location.search('filter', $scope.search_query);
        else
            $location.search('filter', null);
        $scope.getList();
    })
}]);

gerritmetrix.controller('ciCtrl', ['$scope', '$http', '$state', 'SweetAlert', 'CI', '$location', '$stateParams', function($scope, $http, $state, SweetAlert, CI, $location, $stateParams) {
    $scope.title = "";
    $scope.name = $stateParams.name;
    $scope.subtitle = $scope.name;

    $scope.limit = 50;
    $scope.skip = 0;
    $scope.total_rows = 0;
    $scope.search_query = '';

    $scope.generateQueryParams = function() {
        return {
            limit: $scope.limit,
            skip: $scope.skip,
            search: $scope.search_query,
            name: $scope.name
        };
    }

    if (typeof $location.search().filter != 'undefined')
        $scope.search_query = $location.search().filter;

    $scope.getList = function() {
        CI.getJobs($scope.generateQueryParams())
            .then(function(data) {
                $scope.jobs = data.data.rows;
                $scope.total_rows = $scope.jobs.length;
            }, function(data) {
                $state.go('app.404');
            })
    }



    $scope.$watch('search_query', function () {
        if ($scope.search_query != '')
            $location.search('filter', $scope.search_query);
        else
            $location.search('filter', null);
        $scope.getList();
    })

}])