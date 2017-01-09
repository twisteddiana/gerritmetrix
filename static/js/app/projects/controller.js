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

gerritmetrix.controller('projectTableCtrl', ['$scope', '$http', '$state', 'Projects', '$location', '$stateParams', 'CI', '$timeout', 'Changes', '$sce', '$window', function($scope, $http, $state, Projects, $location, $stateParams, CI, $timeout, Changes, $sce, $window) {
    $scope.title = "Project";
    $scope.project_name = $stateParams.project_name;
    $scope.subtitle = $scope.project_name;
    $scope.authors = [{name: 'Jenkins', username: 'jenkins', color: getRandomColor(), individual: 1,  show_jobs: 1, rendered: 0}]
    $scope.results = {};
    $scope.changes = [];
    $scope.interval = "7";
    $scope.dates = {
        start: getTimestamp($scope.interval),
        end: Math.floor(Date.now() / 1000)
    }

    $scope.change_tooltips = {};

    $scope.only_selected_jobs = false;
    $scope.selected_jobs = [];

    $scope.select_job = function(job) {
        /*var index = $scope.selected_jobs.indexOf(job);
         if (index > -1)
         $scope.selected_jobs.splice(index, 1);
         else
         $scope.selected_jobs.push(job);*/
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

    $scope.final_results = {};
    $scope.author_result = {};
    $scope.patchSet_width = 50;
    $scope.margin = 0;

    //the visible ones
    $scope.visible_changes = []
    $scope.visible_author_results = []
    $scope.visible_final_results = []

    var resizeArrays = function() {
        //update visible
        $scope.visible_changes = $scope.changes.slice($scope.display_limits.begin, $scope.display_limits.begin + $scope.display_limits.limit);
        angular.forEach($scope.author_result, function(results, author) {
            $scope.visible_author_results[author] = results.slice($scope.display_limits.begin, $scope.display_limits.begin + $scope.display_limits.limit);
            $scope.visible_final_results[author] = {}
            angular.forEach($scope.final_results[author], function(results, job) {
                $scope.visible_final_results[author][job] = results.slice($scope.display_limits.begin, $scope.display_limits.begin + $scope.display_limits.limit);
            })
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
                limit: displayed_elements + 2 * $scope.margin,
                begin: 0
            }
        else {
            $scope.display_limits.limit = displayed_elements + 2 * $scope.margin;
        }

        resizeArrays();
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

        $scope.display_limits.begin = Math.max(0, elems_before - $scope.margin);

        resizeArrays();
        $scope.$broadcast('suspend');
        $scope.$digest();
        $scope.$broadcast('resume');
    })

    calibrate();
    angular.element($window).on('resize', function() {
        calibrate();
    })

    $scope.updateAuthor = function(author) {
        //$scope.getValues(author);
    }

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

            $scope.processResults(author);
            resizeArrays();
        })
    }

    $scope.searchAuthor = function(piece) {
        return CI.getAuthors(piece, $scope.project_name).then(function(data) {
            return data.data.result.map(function(result) {
                return result;
            })
        })
    }

    $scope.authorSelect = function($item) {
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
        $item['selected'] = 0;
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
        var author_results = {}
        angular.forEach(author.jobs, function(job) {
            final_results[job.job] = {}
            angular.forEach($scope.changes, function(change_arr) {
                if (typeof final_results[job.job][change_arr[0]] == 'undefined')
                    final_results[job.job][change_arr[0]] = {}
                if (typeof final_results[job.job][change_arr[0]][change_arr[1]] == 'undefined')
                    final_results[job.job][change_arr[0]][change_arr[1]] = []

                author_results[change_arr] = {
                    item_html: '',
                    total: 0,
                    text: '<div>No results</div>',
                    change: change_arr[0],
                    patchSet: change_arr[1],
                    id: change_arr[0] + '_' + change_arr[1]
                };
            })
        })

        angular.forEach($scope.results[author.username], function(result) {
            if (typeof result.result == 'undefined')
                result.result = 0;
            final_results[result.job][result.number][result.patchSet].push({build_result: result.build_result, result: result.result, date: result.checkedOn})
        })

        var extra_final_results = {}

        angular.forEach(author.jobs, function(job) {
            var linear = [];

            angular.forEach($scope.changes, function (change_arr) {
                var change = change_arr[0];
                var patchSet = change_arr[1];

                var total = final_results[job.job][change][patchSet].length;

                var text = "<div>";
                var item_html = "";

                var draw_author_line = false;
                if (author_results[change_arr].total == 0) {
                    var text_author = "<div>";
                    var item_html_author = "";
                    draw_author_line = true;
                }

                angular.forEach(final_results[job.job][change][patchSet], function (result) {
                    var class_name = '';
                    if (result.result == null || result.result.toLowerCase().indexOf('fail') == 0) {
                        class_name = 'fraction-fail';
                    }
                    else if (result.result.toLowerCase().indexOf('succ') == 0) {
                        class_name = 'fraction-success';
                    }
                    else {
                        class_name = 'fraction-other';
                    }

                    var date = new Date(result.date * 1000);
                    text += '<p> Result <b>' + result.result + '</b> at ' + date.toUTCString() + '</p>';
                    item_html += '<div class="fraction ' + class_name + '" style="width: ' + 100 / total + '%"></div>';

                    if (draw_author_line) {
                        var class_name = '';
                        if (result.build_result == null || result.build_result.indexOf('fail') == 0) {
                            class_name = 'fraction-fail';
                        }
                        else if (result.build_result.indexOf('succ') == 0) {
                            class_name = 'fraction-success';
                        }
                        else {
                            class_name = 'fraction-other';
                        }

                        var date = new Date(result.date * 1000);
                        text_author += '<p> Build result <b>'+ result.build_result +'</b> at ' + date.toUTCString() + '</p>';

                        item_html_author += '<div class="fraction '+class_name+'" style="width: '+ 100 / total +'%"></div>'
                    }
                })

                if (total == 0)
                    text += 'No results';
                else {
                    var head_text = '';
                    if (total > 2)
                        head_text = '<p>' + (total - 1) + ' rechecks</p>';
                    else if (total == 2)
                        head_text = '<p>1 recheck</p>';

                    text = text.replace('<div>', '<div>' + head_text);
                }

                text += '</div>';

                if (draw_author_line && total > 0) {
                    var head_text = '';
                    if (total > 2)
                        head_text = '<p>'+ (total - 1) + ' rechecks</p>';
                    else if (total == 2)
                        head_text = '<p>1 recheck</p>';

                    text_author = text_author.replace('<div>', '<div>' + head_text);
                    text_author += '</div>';
                } else {
                    draw_author_line = false;
                }

                var result_item = {
                    item_html: $sce.trustAsHtml(item_html),
                    total: total,
                    text: text,
                    change: change,
                    patchSet: patchSet,
                    job: job.job,
                    id: change + '_' + patchSet
                }

                linear.push(result_item);

                if (draw_author_line) {
                    var result_item_author = {
                        item_html: $sce.trustAsHtml(item_html_author),
                        total: total,
                        text: text_author,
                        change: change,
                        patchSet: patchSet,
                        id: change + '_' + patchSet
                    }

                    author_results[change_arr] = result_item_author;
                }
            })

            extra_final_results[job.job] = linear;
        })

        $scope.final_results[author.username] = extra_final_results;
        var linear_author = [];
        angular.forEach(author_results, function(result) {
            linear_author.push(result);
        })
        $scope.author_result[author.username] = linear_author;
    }

    function getTimestamp(days) {
        var oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - days);
        return Math.floor(oneWeekAgo.getTime() / 1000);
    }

    $scope.trustAsHtml = function(html) {
        return $sce.trustAsHtml(html);
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