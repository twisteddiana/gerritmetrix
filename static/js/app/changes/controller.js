/**
 * Created by diana on 17.12.2016.
 */

gerritmetrix.controller("changesCtrl",['$scope', '$http', '$state', 'SweetAlert', 'Changes', '$location', function ($scope, $http, $state, SweetAlert, Changes, $location) {
    $scope.title = "Changes";
    $scope.subtitle = "List";

    $scope.limit = 50;
    $scope.skip = 0;
    $scope.total_rows = 0;
    $scope.search_query = {
        project: '',
        status: ''
    }

    var qs = $location.search();
    for (var fld in $scope.filters) {
        if (fld in qs) {
            $scope.search_query[fld] = qs[fld];
        }
    }

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
        Changes.get($scope.generateQueryParams()).then(function(data) {
            $scope.changes = data.data.rows;
            $scope.total_rows = $scope.changes.length;
        })
    }

    $scope.$watch('search_query', function () {
        // update the query string with the new filters
        for (fld in $scope.search_query) {
            if ($scope.search_query[fld] != '') {
                $location.search(fld, $scope.search_query[fld]);
            } else {
                // remove empty filters
                $location.search(fld, null);
            }
        }

        $scope.skip = 0;
        $location.search('page', null);

        $scope.getList();
    }, true);
}]);

gerritmetrix.controller('changeCtrl', ['$scope', '$http', '$state', 'SweetAlert', 'Changes', '$location', '$stateParams', function($scope, $http, $state, SweetAlert, Changes, $location, $stateParams) {
    $scope.title = "Change";
    $scope.change_number = $stateParams.change_number;
    $scope.subtitle = $scope.change_number;

    Changes.getChange($scope.change_number)
        .then(function(data) {
            $scope.change = data.data;
            $scope.title = $scope.change.change.project;
            $scope.lastPatchSet = $scope.change.patchSets.splice(-1)[0];
            $scope.lastComments = [];
            for (i in $scope.change.comments) {
                var comment = $scope.change.comments[i];
                if (comment.patchSet.number == $scope.lastPatchSet.patchSet.number)
                    $scope.lastComments.push(comment);
            }
        }, function(data) {
            $state.go('app.404');
        })
}])