/**
 * Created by diana on 15.12.2016.
 */
gerritmetrix.factory('Projects', ['$http', '$sce', function($http, $sce) {
    return {
        get: function (data) {
            return $http.post('/projects', data);
        },
        getChanges: function(data) {
            return $http.post('/project', data);
        },
        getChart: function(data) {
            return $http.post('/project_chart', data);
        },
        resizeArrays: function ($scope) {
            $scope.visible_changes = $scope.changes.slice($scope.display_limits.begin, $scope.display_limits.begin + $scope.display_limits.limit);
            angular.forEach($scope.author_result, function(results, author) {
                $scope.visible_author_results[author] = results.slice($scope.display_limits.begin, $scope.display_limits.begin + $scope.display_limits.limit);
                $scope.visible_final_results[author] = {}
                angular.forEach($scope.final_results[author], function(results, job) {
                    $scope.visible_final_results[author][job] = results.slice($scope.display_limits.begin, $scope.display_limits.begin + $scope.display_limits.limit);
                })
            })
        },
        processResults: function(author, $scope) {
            var final_results = {};
            var author_results = {};
            var extra_final_results = {}

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
                        text: '',
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

            angular.forEach(author.jobs, function(job) {
                var linear = [];

                angular.forEach($scope.changes, function (change_arr) {
                    var change = change_arr[0];
                    var patchSet = change_arr[1];

                    var total = final_results[job.job][change][patchSet].length;

                    var text = '';
                    var item_html = '';

                    var draw_author_line = false;
                    if (author_results[change_arr].total == 0) {
                        var text_author = '<div>';
                        var item_html_author = '';
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
                        text += '<p><b>' + result.result + '</b> at ' + date.toDateString() + ' ' + date.toLocaleTimeString()+ '</p>';
                        item_html += '<div class="fraction ' + class_name + '" style="width: ' + 100 / total + '%"></div>';

                        if (draw_author_line) {
                            var class_name = '';
                            if (result.build_result == null || result.build_result.indexOf('fail') == 0) {
                                class_name = 'fraction-fail';
                                result.build_result = 'failure';
                            }
                            else if (result.build_result.indexOf('succ') == 0) {
                                class_name = 'fraction-success';
                            }
                            else {
                                class_name = 'fraction-other';
                            }

                            var date = new Date(result.date * 1000);
                            text_author += '<p><b>'+ result.build_result.toUpperCase() +'</b> at ' + date.toDateString() + ' ' + date.toLocaleTimeString() + '</p>';

                            item_html_author += '<div class="fraction '+class_name+'" style="width: '+ 100 / total +'%"></div>'
                        }
                    })

                    if (total == 0) {

                    } else {
                        var head_text = '';
                        if (total > 2)
                            head_text = '<p>' + (total - 1) + ' rechecks</p>';
                        else if (total == 2)
                            head_text = '<p>1 recheck</p>';

                        text = '<div>' + head_text + text + '</div>'
                    }

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
    }
}])
