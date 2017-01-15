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
    var height = $window.innerHeight -  getOffset(document.getElementsByClassName('table-list')[0]).top - 120;
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

gerritmetrix.controller('projectViewCtrl', ['$scope', '$http', '$state', 'SweetAlert', 'Projects', '$location', '$stateParams', '$window', function($scope, $http, $state, SweetAlert, Projects, $location, $stateParams, $window) {
    $scope.title = "Project";
    $scope.project_name = $stateParams.project_name;
    $scope.subtitle = $scope.project_name;

    $scope.limit = 50;
    $scope.skip = 0;
    $scope.total_rows = 0;

    //calculate available height
    var height = $window.innerHeight -  getOffset(document.getElementsByClassName('table-list')[0]).top - 120;
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

gerritmetrix.controller('projectTableCtrl', ['$scope', '$http', '$state', 'Projects', '$location', '$stateParams', 'CI', '$timeout', 'Changes', '$sce', '$window', '$filter', function($scope, $http, $state, Projects, $location, $stateParams, CI, $timeout, Changes, $sce, $window, $filter) {
    $scope.title = "Project";
    $scope.project_name = $stateParams.project_name;
    $scope.subtitle = $scope.project_name;
    $scope.authors = [{name: 'Jenkins', username: 'jenkins', individual: 1,  show_jobs: 1}]
    $scope.results = {};
    $scope.changes = [];
    $scope.interval = "7";
    $scope.final_results = {};
    $scope.author_result = {};
    $scope.change_tooltips = {};

    $scope.only_selected_jobs = false;
    $scope.selected_jobs = [];

     //the visible ones
    $scope.visible_changes = [];
    $scope.visible_author_results = [];
    $scope.visible_final_results = [];

    $scope.standard_width = {
        full: 50,
        compact: 25
    };
    $scope.patchSet_width = $scope.standard_width.full;


    if (typeof $location.search().interval != 'undefined')
        $scope.interval = $location.search().interval;

    $scope.dates = {
        start: getTimestamp($scope.interval),
        end: Math.floor(Date.now() / 1000)
    }

    if ($scope.interval == 0) {
        $scope.dates.start = Math.floor(new Date($location.search().date_from) / 100);
        $scope.dates.end = Math.floor(new Date($location.search().date_to) / 1000);

        $scope.datepickerFrom = new Date($location.search().date_from);
        $scope.datepickerTo = new Date($location.search().date_to);
    }

    $scope.select_job = function(job) {
        angular.forEach($scope.authors, function(author) {
            if (author.username == job) {
                author.selected = !author.selected;
            } else {
                angular.forEach(author.jobs, function(_job) {
                    if (_job.job == job)
                        _job.selected = !_job.selected;
                })
            }
        })
    }

    var calibrate = function() {
        var total_width = $('#box_holder').width() - 30 - $('.change_left').width();
        var partial_displayed = total_width / $scope.patchSet_width;
        var dec = partial_displayed * 10 % 10;
        if (dec > 5) {
            var displayed_elements = Math.ceil(partial_displayed);
        } else {
            var displayed_elements = Math.floor(partial_displayed);
        }

        $scope.patchSet_width = total_width / displayed_elements;

        if (typeof $scope.display_limits == 'undefined')
            $scope.display_limits = {
                limit: displayed_elements,
                begin: 0
            }
        else {
            $scope.display_limits.limit = displayed_elements;
        }

        Projects.resizeArrays($scope);
    }

    $scope.switchView = function() {
        if ($scope.compact_view)
            $scope.patchSet_width = $scope.standard_width.compact;
        else
            $scope.patchSet_width = $scope.standard_width.full;

        calibrate();
    }

    $scope.loadChangeTooltip = function(change, $event) {
        if (typeof $scope.change_tooltips[change] == 'undefined') {
            Changes.getChange(change[0]).then(function (data) {
                $scope.change_tooltips[change] = {
                    commitMessage: data.data.change.commitMessage,
                }
                angular.forEach(data.data.patchSets, function(patchSet) {
                    if (patchSet.patchSet.number == change[1]) {
                        $scope.change_tooltips[change].kind = patchSet.patchSet.kind;
                        $scope.change_tooltips[change].date = patchSet.patchSet.createdOn;
                    }
                })
                if (angular.element($event.currentTarget).is(':hover'))
                    angular.element($event.currentTarget).trigger('mouseoverAjax');
            })
        } else {
            angular.element($event.currentTarget).trigger('mouseoverAjax');
        }
    }

    $scope.hideTooltip = function($event) {
        angular.element($event.target).trigger('mouseleaveAjax');
    }

    $scope.$on('haveScrolled', function(event, scroll) {
        var elems_before = Math.floor(scroll / $scope.patchSet_width);

        $scope.display_limits.begin = Math.max(0, elems_before);

        Projects.resizeArrays($scope);
        $scope.$broadcast('suspend');
        $scope.$digest();
        $scope.$broadcast('resume');
    })

    calibrate();
    angular.element($window).on('resize', function() {
        calibrate();
    })

    $scope.generateQueryParams = function(author) {

        var obj = {
            project: $scope.project_name,
            start: $scope.dates.start,
            end: $scope.dates.end,
            author: author.username,
            individual: author.individual,
        };

        if (!$scope.changes.length)
            obj.including_changes = 1;
        else {
            obj.including_changes = 0;
            obj.changes_list = $scope.changes_list;
        }

        return obj;
    }

    $scope.getAllValues = function() {
        $scope.changes = {};
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

            if (typeof data.data.changes != 'undefined') {
                $scope.changes_list = data.data.changes_list;
                $scope.changes = data.data.changes;
                $scope.patchSet_count = $scope.changes.length;
            }

            Projects.processResults(author, $scope);
            Projects.resizeArrays($scope);
        })
    }

    $scope.searchAuthor = function(piece) {
        return CI.getAuthors(piece, $scope.project_name).then(function(data) {
            return data.data.result.map(function(result) {
                return result;
            })
        })
    }

    $scope.authorSelect = function(_author) {
        var found = false;
        angular.forEach($scope.authors, function(author) {
            if (author.username == _author.username)
                found = true;
        })

        if (found) {
            return;
        }

        _author['individual'] = 1;
        _author['selected'] = 0;
        _author['show_jobs'] = 1;
        _author['rendered'] = 0;
        $scope.authors.push(_author);
        $scope.authorSearch = '';
        $scope.getValues(_author);

        //add the location
        if (typeof $location.search().authors == 'undefined') {
            var list = []
            angular.forEach($scope.authors, function(author) {
                list.push(author.username);
            })
            $location.search('authors', list.join(','));
        }
        else {
            var list = $location.search().authors.split(',');
            if (list.indexOf(_author.username) == -1)
                list.push(_author.username);
            $location.search('authors', list.join(','));
        }
    }

    if (typeof $location.search().authors != 'undefined') {
        var authors = $location.search().authors.split(',');
        angular.forEach(authors, function(piece) {
            var result = $scope.searchAuthor(piece).then(function (results) {
               angular.forEach(results, function(result) {
                   if (result.username == piece)
                       $scope.authorSelect(result);
               })
            });
        })
    }

    $scope.removeAuthor = function(author) {
        var index = $scope.authors.indexOf(author);
        $scope.authors.splice(index, 1);
        delete $scope.results[author.username];
        delete $scope.final_results[author.username];
        delete $scope.visible_final_results[author.username];
        delete $scope.visible_author_results[author.username];
        if (typeof $location.search().authors != 'undefined') {
             var list = $location.search().authors.split(',');
             var index = list.indexOf(author.username);
             list.splice(index, 1);
             $location.search('authors', list.join(','));
        }
    }

    $scope.intervalChanged = function() {
        if ($scope.interval != '0') {
            $scope.dates.start = getTimestamp($scope.interval);
            $scope.dates.end = Math.floor(Date.now() / 1000);
            $scope.getAllValues();
            $location.search('date_from', null);
            $location.search('date_to', null);
        }
        else {
            //watch for dates
        }

        $location.search('interval', $scope.interval);
    }

    $scope.$watchGroup(['datepickerFrom', 'datepickerTo'], function() {
        if (typeof $scope.datepickerFrom != 'undefined')
            $scope.dates.start = Math.floor($scope.datepickerFrom.getTime() / 1000);
        if (typeof $scope.datepickerTo != 'undefined')
            $scope.dates.end = Math.floor($scope.datepickerTo.getTime() / 1000) + 86400;

        if (typeof $scope.datepickerFrom != 'undefined' && typeof $scope.datepickerTo != 'undefined') {
            $scope.getAllValues();
            $location.search('date_from', $filter('date')($scope.datepickerFrom, 'yyyy-MM-dd'));
            $location.search('date_to', $filter('date')($scope.datepickerTo, 'yyyy-MM-dd'));
        }
    })

    function getTimestamp(days) {
        var oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - days);
        return Math.floor(oneWeekAgo.getTime() / 1000);
    }

    $scope.trustAsHtml = function(html) {
        return $sce.trustAsHtml(html);
    }

    $scope.getAllValues();
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
        $scope.changes = {};
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
                        author.jobs.push({job: result.job, color: getRandomColor(), selected: false});
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