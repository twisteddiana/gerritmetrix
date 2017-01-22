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

gerritmetrix.controller('changeCtrl', ['$scope', '$http', '$state', 'SweetAlert', 'Changes', '$location', '$stateParams', 'Projects', function($scope, $http, $state, SweetAlert, Changes, $location, $stateParams, Projects) {
    $scope.title = "Change";
    $scope.change_number = $stateParams.change_number;
    $scope.subtitle = $scope.change_number;

    $scope.authors = {jenkins: {username: 'jenkins', name: 'Jenkins', jobs: []}}

    $scope.patchSet_width = 50;

    var prepareChange = function(change) {
        $scope.change = change;
        $scope.title = $scope.change.change.project;

        $scope.patchSets = [];
        $scope.change_list = {}
        $scope.changes = []
        $scope.change_list[$scope.change_number] = []
        angular.forEach($scope.change.patchSets, function(patchSet) {
            $scope.patchSets.push({
                number: patchSet.patchSet.number,
                kind: patchSet.patchSet.kind,
                date: patchSet.patchSet.createdOn
            });
            $scope.change_list[$scope.change_number].push(patchSet.patchSet.number);
            $scope.changes.push([$scope.change_number, patchSet.patchSet.number]);
        })

        $scope.results = {}
        $scope.final_results = {}
        angular.forEach($scope.change.comments, function(comment) {
            if (typeof $scope.authors[comment.author.username] == 'undefined') {
                $scope.authors[comment.author.username] = {
                    username: comment.author.username,
                    name: comment.author.name,
                    jobs: []
                }
                $scope.results[comment.author.username] = [];
            }
        })

        angular.forEach($scope.authors, function(author) {
            Changes.getChart({
                project: $scope.change.change.project,
                author: author.username,
                change: $scope.change_number
            }).then(function(data) {

                if (typeof data.data.result[0] == 'undefined')
                    $scope.results[author.username] = []
                else
                    $scope.results[author.username] = data.data.result;

                author.jobs = []
                var jobs = {}
                angular.forEach(data.data.jobs, function(job) {
                    if (typeof jobs[job] == 'undefined') {
                        author.jobs.push({job: job});
                        jobs[job] = 1;
                    }
                })

                $scope.processResults(author);
            })
        })

    }

    $scope.processResults = function(author) {

        var final_results = {};
        angular.forEach(author.jobs, function(job) {
            final_results[job.job] = {}
            angular.forEach($scope.patchSets, function(patchSet) {
                if (typeof final_results[job.job][$scope.change_number] == 'undefined')
                    final_results[job.job][$scope.change_number] = {}
                if (typeof final_results[job.job][$scope.change_number][patchSet.number] == 'undefined')
                    final_results[job.job][$scope.change_number][patchSet.number] = []
            })
        })

        angular.forEach($scope.results[author.username], function(result) {
            if (typeof result.result == 'undefined')
                result.result = 0;
            if (typeof final_results[result.job][result.number][result.patchSet] != 'undefined')
                final_results[result.job][result.number][result.patchSet].push({
                    build_result: result.build_result, result: result.result, date: result.checkedOn
                })
        })

        $scope.final_results[author.username] = final_results;
    }

    Changes.getChange($scope.change_number)
        .then(function(data) {
            prepareChange(data.data);
        }, function(data) {
            $state.go('app.404');
        })
}])