/**
 * Created by diana on 15.12.2016.
 */
gerritmetrix.controller("projectsCtrl",['$scope', '$http', '$state', 'SweetAlert', 'Projects', '$location', '$window', function ($scope, $http, $state, SweetAlert, Projects, $location, $window) {
    $scope.title = "Projects";
    $scope.subtitle = "List";

    $scope.limit = 50;
    $scope.skip = 0;
    $scope.total_rows = 0;

    //calculate available height
    var height = $(window).height() -  $('.table-list').offset().top - 120;
    var total = Math.floor(height/24);
    $scope.limit = total;


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
        Projects.get($scope.generateQueryParams()).then(function(data) {
            $scope.projects = data.data.rows;
            $scope.total_rows = $scope.projects.length;
        })
    }

    $scope.getList();

    $scope.$watch('search_query', function (oldval, newval) {
        if (oldval == newval)
            return;


        if ($scope.search_query != '')
            $location.search('filter', $scope.search_query);
        else
            $location.search('filter', null);

        $scope.skip = 0;
        $location.search('page', null);

        $scope.getList();
    })
}]);

gerritmetrix.controller('projectViewCtrl', ['$scope', '$http', '$state', 'SweetAlert', 'Projects', '$location', '$stateParams', function($scope, $http, $state, SweetAlert, Projects, $location, $stateParams) {
    $scope.title = "Project";
    $scope.project_name = $stateParams.project_name;
    $scope.subtitle = $scope.project_name;

    $scope.limit = 50;
    $scope.skip = 0;
    $scope.total_rows = 0;

    //calculate available height
    var height = $(window).height() -  $('.table-list').offset().top - 70;
    var total = Math.floor(height/24);
    $scope.limit = total;

    $scope.generateQueryParams = function() {
        return {
            limit: $scope.limit,
            skip: $scope.skip,
            project_name: $scope.project_name
        };
    }

    $scope.getList = function() {
        Projects.getChanges($scope.generateQueryParams()).then(function (data) {
            $scope.changes = data.data.rows;
            $scope.total_rows = $scope.changes.length;
        })
    }

    $scope.getList();
}])

gerritmetrix.controller('projectTableCtrl', ['$scope', '$http', '$state', 'Projects', '$location', '$stateParams', 'CI', '$timeout', function($scope, $http, $state, Projects, $location, $stateParams, CI, $timeout) {
    $scope.title = "Project";
    $scope.project_name = $stateParams.project_name;
    $scope.subtitle = $scope.project_name;
    $scope.authors = [{name: 'Jenkins', username: 'jenkins', color: getRandomColor(), individual: 1,  show_jobs: 1, rendered: 0}]
    $scope.results = {};
    $scope.changes = {};
    $scope.interval = "7";
    $scope.dates = {
        start: getTimestamp($scope.interval),
        end: Math.floor(Date.now() / 1000)
    }

    $scope.only_selected_jobs = false;
    $scope.selected_jobs = [];

    $scope.select_job = function(job) {
        var index = $scope.selected_jobs.indexOf(job);
        if (index > -1)
            $scope.selected_jobs.splice(index, 1);
        else
            $scope.selected_jobs.push(job);
    }

    $scope.final_results = {}
    $scope.patchSet_width = 50;
    $scope.margin = 20;

    var calibrate = function() {
        var total_width = $('#box_holder').width() - 30 - 400;
        var displayed_elements = Math.ceil(total_width / $scope.patchSet_width);

        if (typeof $scope.display_limits == 'undefined')
            $scope.display_limits = {
                limit: displayed_elements + 2 * $scope.margin,
                begin: 0
            }
        else {
            $scope.display_limits.limit = displayed_elements + 2 * $scope.margin;
        }
    }

    $('.holder').scroll(function() {
        $timeout(function () {
            var scroll_current = $('.holder').scrollLeft();
            var elems_before = Math.floor(scroll_current / $scope.patchSet_width);

            $scope.display_limits.begin = Math.max(0, elems_before - $scope.margin);

            $('.table-holder').css('padding-left', $scope.display_limits.begin * $scope.patchSet_width + 'px');
            $('.thead.fixed').css('padding-left', $scope.display_limits.begin * $scope.patchSet_width + 'px');
        }, 20);
    })

    calibrate();
    $(window).resize(function() {
        calibrate();
    })

    $scope.updateAuthor = function(author) {
        //$scope.getValues(author);
    }

    $scope.generateQueryParams = function(author) {
        return {
            project: $scope.project_name,
            start: $scope.dates.start,
            end: $scope.dates.end,
            author: author.username,
            individual: author.individual,
            including_changes: 1
        };
    }

    var loaded = 0;

    $scope.getAllValues = function() {
        loaded = 0;
        angular.forEach($scope.authors, function(author){
            $scope.getValues(author, true);
        })
    }

    $scope.getValues = function(author, all) {

        Projects.getChart($scope.generateQueryParams(author)).then(function(data) {

            if (typeof data.data.result[0] == 'undefined')
                $scope.results[author.username] = []
            else
                $scope.results[author.username] = data.data.result;

            if (author.individual) {
                author.jobs = []
                var jobs = {}
                angular.forEach(data.data.jobs, function(job) {
                    if (typeof jobs[job] == 'undefined') {
                        author.jobs.push({job: job, color: getRandomColor()});
                        jobs[job] = 1;
                    }
                })
            }

            $scope.changes = data.data.changes;
            $scope.patchSet_count = $scope.changes.length;

            $scope.processResults(author);
        })
    }

    $scope.searchAuthor = function(piece) {
        return CI.getAuthors(piece, $scope.project_name).then(function(data) {
            return data.data.result.map(function(result) {
                return result;
            })
        })
    }

    $scope.authorSelect = function($item, $model, $label) {
        var found = false;
        angular.forEach($scope.authors, function(author) {
            if (author.username == $item.username)
                found = true;
        })

        if (found) {
            return;
        }

        $item['color'] = getRandomColor();
        $item['individual'] = 1;
        $item['show_jobs'] = 1;
        $item['rendered'] = 0;
        $scope.authors.push($item);
        $scope.authorSearch = '';
        $scope.getValues($item);
    }

    $scope.getAllValues();

    $scope.removeAuthor = function(author) {
        var index = $scope.authors.indexOf(author);
        $scope.authors.splice(index, 1);
        delete $scope.results[author.username];
        $scope.processResults();
    }

    $scope.tickChanged = function() {
        $scope.processResults();
    }

    $scope.intervalChanged = function() {
        if ($scope.interval != '0') {
            $scope.dates.start = getTimestamp($scope.interval);
            $scope.dates.end = Math.floor(Date.now() / 1000);
            $scope.getAllValues();
        }
        else {
            //watch for dates
        }
    }

    $scope.$watchGroup(['datepickerFrom', 'datepickerTo'], function() {
        if (typeof $scope.datepickerFrom != 'undefined')
            $scope.dates.start = Math.floor($scope.datepickerFrom.getTime() / 1000);
        if (typeof $scope.datepickerTo != 'undefined')
            $scope.dates.end = Math.floor($scope.datepickerTo.getTime() / 1000) + 86400;

        if (typeof $scope.datepickerFrom != 'undefined' && typeof $scope.datepickerTo != 'undefined')
            $scope.getAllValues();
    })

    $scope.processResults = function(author) {

        var final_results = {};

        angular.forEach(author.jobs, function(job) {
            final_results[job.job] = {}
            angular.forEach($scope.changes, function(item) {
                if (typeof final_results[job.job][item[0]] == 'undefined')
                    final_results[job.job][item[0]] = {}
                if (typeof final_results[job.job][item[0]][item[1]] == 'undefined')
                    final_results[job.job][item[0]][item[1]] = []
            })
        })

        angular.forEach($scope.results[author.username], function(result) {
            if (typeof result.result == 'undefined')
                result.result = 0;
            final_results[result.job][result.number][result.patchSet].push({build_result: result.build_result, result: result.result, date: result.checkedOn})
        })

        $scope.final_results[author.username] = final_results;
    }

    function getTimestamp(days) {
        var oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - days);
        return Math.floor(oneWeekAgo.getTime() / 1000);
    }

}])

gerritmetrix.controller('projectChartCtrl', ['$scope', '$http', '$state', 'Projects', '$location', '$stateParams', 'CI', function($scope, $http, $state, Projects, $location, $stateParams, CI) {
    $scope.title = "Project";
    $scope.project_name = $stateParams.project_name;
    $scope.subtitle = $scope.project_name;
    $scope.authors = [{name: 'Jenkins', username: 'jenkins', color: getRandomColor(), individual: 0}]
    //$scope.authors = [{name: 'Micro', username: 'microsoft_cinder_ci', color: getRandomColor(), individual: 0}]
    $scope.results = {}
    $scope.interval = "7";
    $scope.split_scale = "12";
    $scope.dates = {
        start: getTimestamp($scope.interval),
        end: Math.floor(Date.now() / 1000)
    }


    $scope.processResults = function() {
        var success_list = {}
        var fail_list = {}
        var max_success_date = $scope.dates.end;
        var min_success_date = $scope.dates.start;
        var max_fail_date = $scope.dates.end;
        var min_fail_date = $scope.dates.start;
        angular.forEach($scope.authors, function(author) {
            if (author.individual) {
                success_list[author.username] = {}
                fail_list[author.username] = {}
                for (i in author.jobs) {
                    success_list[author.username][author.jobs[i].job] = []
                    fail_list[author.username][author.jobs[i].job] = []
                }
            } else {
                success_list[author.username] = [];
                fail_list[author.username] = [];
            }

            angular.forEach($scope.results[author.username], function(result) {
                if (result.eventCreatedOn == null)
                    result.eventCreatedOn = result.checkedOn;
                if (result.result == null || result.result.indexOf('fail') == 0) {
                    if (author.individual)
                        fail_list[author.username][result.job].push(result);
                    else
                        fail_list[author.username].push(result);

                    if (result.eventCreatedOn > max_fail_date)
                        max_fail_date = result.eventCreatedOn;
                    if (result.eventCreatedOn < min_fail_date)
                        min_fail_date = result.eventCreatedOn;
                }
                else if (result.result.indexOf('succ') == 0) {
                    if (author.individual)
                        success_list[author.username][result.job].push(result);
                    else
                        success_list[author.username].push(result);

                    if (result.eventCreatedOn > max_success_date)
                        max_success_date = result.eventCreatedOn;
                    if (result.eventCreatedOn < min_success_date)
                        min_success_date = result.eventCreatedOn;
                }
            })
        })

        var success_interval = max_success_date - min_success_date;

        var fail_interval = max_fail_date - min_fail_date;

        var split = 20; /* insert random number*/

        var split_success = Math.ceil(success_interval / $scope.split_scale / 3600);
        var split_fail = Math.ceil(fail_interval / $scope.split_scale / 3600);

        var generateList = function(split, list, min_date) {
            var list_result = {}
            var max = 0;

            angular.forEach($scope.authors, function (author) {
                if (author.individual) {
                    list_result[author.username] = {}
                    for (i in author.jobs) {
                        var job = author.jobs[i].job;
                        list_result[author.username][job] = []
                        for (i = 0; i <= split; i++)
                            list_result[author.username][job][i] = {
                                counter: 0,
                                date: min_date + i * $scope.split_scale * 3600,
                                results: []
                            };

                        angular.forEach(list[author.username][job], function (result) {
                            if (result.eventCreatedOn == null)
                                result.eventCreatedOn = result.checkedOn;
                            var diff = result.eventCreatedOn - min_date;
                            var index = Math.ceil(diff / $scope.split_scale / 3600);
                            list_result[author.username][job][index].counter++;
                            list_result[author.username][job][index].results.push(result)
                            if (list_result[author.username][job][index].counter > max)
                                max = list_result[author.username][job][index].counter;
                        })
                    }
                } else {
                    list_result[author.username] = []
                    for (i = 0; i <= split; i++)
                        list_result[author.username][i] = {
                            counter: 0,
                            date: min_date + i * $scope.split_scale * 3600,
                            results: []
                        };

                    angular.forEach(list[author.username], function (result) {
                        if (result.eventCreatedOn == null)
                            result.eventCreatedOn = result.checkedOn;
                        var diff = result.eventCreatedOn - min_date;
                        var index = Math.ceil(diff / $scope.split_scale / 3600);
                        list_result[author.username][index].counter++;
                        list_result[author.username][index].results.push(result);
                        if (list_result[author.username][index].counter > max)
                            max = list_result[author.username][index].counter;
                    })
                }
            })

            return [list_result, max];
        }

        var r_success = generateList(split_success, success_list, min_success_date);
        var final_success_list = r_success[0];
        var max_success = r_success[1];

        var r_fail = generateList(split_fail, fail_list, min_fail_date);
        var final_fail_list = r_fail[0];
        var max_fail = r_fail[1];

        $scope.chart = {
            success: {
                list: final_success_list,
                start: min_success_date,
                end: max_success_date,
                tick: $scope.split_scale,
                max_value: max_success,

            },
            fail: {
                list: final_fail_list,
                start: min_fail_date,
                end: max_fail_date,
                tick: $scope.split_scale,
                max_value: max_fail,
            }
        }
    }

    $scope.updateAuthor = function(author) {
        $scope.getValues(author);
    }

    $scope.generateQueryParams = function(author) {
        return {
            project: $scope.project_name,
            start: $scope.dates.start,
            end: $scope.dates.end,
            author: author.username,
            individual: author.individual
        };
    }

    var loaded = 0;

    $scope.getAllValues = function() {
        loaded = 0;
        angular.forEach($scope.authors, function(author){
            $scope.getValues(author, true);
        })
    }

    $scope.getValues = function(author, all) {
        Projects.getChart($scope.generateQueryParams(author)).then(function(data) {
            if (typeof data.data.result[0] == 'undefined')
                $scope.results[author.username] = []
            else
                $scope.results[author.username] = data.data.result;

            if (author.individual) {
                author.jobs = []
                var jobs = {}
                angular.forEach($scope.results[author.username], function(result) {
                    if (typeof jobs[result.job] == 'undefined') {
                        author.jobs.push({job: result.job, color: getRandomColor()});
                        jobs[result.job] = 1;
                    }
                })
            }

            if (all) {
                loaded++;
                if (loaded == $scope.authors.length)
                    $scope.processResults();
            } else {
                $scope.processResults();
            }
        })
    }

    $scope.searchAuthor = function(piece) {
        return CI.getAuthors(piece, $scope.project_name).then(function(data) {
            return data.data.result.map(function(result) {
                return result;
            })
        })
    }

    $scope.authorSelect = function($item, $model, $label) {
        $item['color'] = getRandomColor();
        $item['individual'] = 0;
        $scope.authors.push($item);
        $scope.authorSearch = '';
        $scope.getValues($item);
        $scope.processResults();
    }

    $scope.getAllValues();

    function getTimestamp(days) {
        var oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - days);
        return Math.floor(oneWeekAgo.getTime() / 1000);
    }

    $scope.removeAuthor = function(author) {
        var index = $scope.authors.indexOf(author);
        $scope.authors.splice(index, 1);
        delete $scope.results[author.username];
        delete $scope.chart.success.list[author.username];
        delete $scope.chart.fail.list[author.username];
    }

    $scope.tickChanged = function() {
        $scope.processResults();
    }

    $scope.intervalChanged = function() {
        if ($scope.interval != '0') {
            $scope.dates.start = getTimestamp($scope.interval);
            $scope.dates.end = Math.floor(Date.now() / 1000);
            $scope.getAllValues();
        }
        else {
            //watch for dates
        }
    }

    $scope.$watchGroup(['datepickerFrom', 'datepickerTo'], function() {
        if (typeof $scope.datepickerFrom != 'undefined')
            $scope.dates.start = Math.floor($scope.datepickerFrom.getTime() / 1000);
        if (typeof $scope.datepickerTo != 'undefined')
            $scope.dates.end = Math.floor($scope.datepickerTo.getTime() / 1000) + 86400;

        if (typeof $scope.datepickerFrom != 'undefined' && typeof $scope.datepickerTo != 'undefined')
            $scope.getAllValues();
    })


}])