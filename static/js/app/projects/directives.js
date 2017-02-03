/**
 * Created by diana on 01.01.2017.
 */

gerritmetrix.directive('ciTableHeader', function() {
    return {
        templateUrl: 'static/templates/utils/table/header.html',
        scope: true,
        link: function(scope, iElement, iAttrs) {
            scope.$watch(iAttrs.changes, function(changes){
                var linear = [];
                angular.forEach(changes, function(list, change) {
                    angular.forEach(list, function(patchset) {
                        linear.push({
                            change: change,
                            patchSet: patchset
                        });
                    })
                })

                scope.linear = linear;
            })
        }
    }
})

gerritmetrix.directive('ciAuthorHeader', function($sce) {
    return {
        templateUrl: 'static/templates/utils/table/author_header.html',
        scope: true,
        link: function (scope, iElement, iAttrs) {
            scope.$watchGroup([iAttrs.results, iAttrs.author], function (values) {
                var author = values[1];
                var results = values[0];

                if (typeof results == 'undefined' || typeof author == 'undefined')
                    return;

                var linear = [];
                if (author.jobs.length) {
                    var first_job = author.jobs[0].job;

                    angular.forEach(scope.changes, function (change_arr) {
                        var change = change_arr[0];
                        var patchSet = change_arr[1];

                        var text = "<div>";

                        angular.forEach(author.jobs, function(job) {
                            if (results[job.job][change][patchSet].length)
                                first_job = job.job;
                        })

                        var total = results[first_job][change][patchSet].length;
                        var item_html = '';
                        angular.forEach(results[first_job][change][patchSet], function (result) {
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
                            text += '<p> Build result <b>'+ result.build_result +'</b> at ' + date.toUTCString() + '</p>';

                            item_html += '<div class="fraction '+class_name+'" style="width: '+ 100 / total +'%"></div>'
                        })

                        if (total == 0)
                            text += 'No results';
                        else {
                            var head_text = '';
                            if (total > 2)
                                head_text = '<p>'+ (total - 1) + ' rechecks</p>';
                            else if (total == 2)
                                head_text = '<p>1 recheck</p>';

                            text = text.replace('<div>', '<div>' + head_text);
                        }

                        text += '</div>';

                        var result_item = {
                            item_html: item_html,
                            total: total,
                            text: text,
                            change: change,
                            patchSet: patchSet,
                            id: change + '_' + patchSet
                        }

                        linear.push(result_item);

                    })
                } else {
                    angular.forEach(scope.changes, function (change_arr) {
                        var change = change_arr[0];
                        var patchSet = change_arr[1];
                        var item = [];
                        var total = 0;

                        var text = "";
                        var result_item = {
                            item_html: '',
                            total: total,
                            text: text,
                            change: change,
                            patchSet: patchSet,
                            id: change + '_' + patchSet
                        }

                        linear.push(result_item);

                    })
                }

                scope.linear = linear;
            })

            scope.trustAsHtml = function(html) {
                return $sce.trustAsHtml(html);
            }
        }
    }
})

gerritmetrix.directive('ciAuthorContent', function($sce, $compile) {
    return {
        templateUrl: 'static/templates/utils/table/author_content.html',
        scope: true,
        link: function (scope, iElement, iAttrs) {
            scope.loaded = false;
            scope.$watchGroup([iAttrs.results, iAttrs.author, iAttrs.job], function (values) {
                var author = values[1];
                var results = values[0];
                var job = values[2];

                if (typeof results == 'undefined' || typeof author == 'undefined')
                    return;

                var linear = [];

                angular.forEach(scope.changes, function (change_arr) {
                    var change = change_arr[0];
                    var patchSet = change_arr[1];

                    var full_html = "";
                    //var item = []
                    var total = results[change][patchSet].length;

                    var text = "<div>";
                    var item_html = "";
                    angular.forEach(results[change][patchSet], function (result) {
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
                        item_html += '<div class="fraction ' + class_name + '" style="width: ' + 100 / total + '%"></div>'
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

                    var result_item = {
                        item_html: item_html,
                        total: total,
                        text: text,
                        change: change,
                        patchSet: patchSet,
                        job: job.job,
                        id: change + '_' + patchSet
                    }

                    linear.push(result_item);
                })

                scope.linear = linear;
            })

            scope.trustAsHtml = function(html) {
                return $sce.trustAsHtml(html);
            }
        }
    }
})

gerritmetrix.component('tableMouseoverScroll', {
    controller: function($document, $window, $scope, $timeout) {
        var init = function() {
            $(document).on('mouseover', '.patchset-content', function(){
                var patchset = $(this).data('patchset');
                var change = $(this).data('change');
                var job = $(this).data('job');

                $(document).find('.patchset-content[data-change='+change+'][data-patchset='+patchset+']').addClass('hovered');
                $(document).find('.patchset-content[data-job="'+job+'"]').addClass('hovered');
                $(document).find('.change_left[data-job="'+job+'"]').addClass('hovered');
                $(document).find('.patchset-header[data-change='+change+'][data-patchset='+patchset+']').addClass('hovered');
                $(document).find('.change-header[data-change='+change+']').addClass('hovered');
            })

            $(document).on('mouseover', '.change_left', function() {
                var job = $(this).data('job');
                $(this).addClass('hovered');
                $(document).find('.patchset-content[data-job="'+job+'"]').addClass('hovered');
            })

            $(document).on('mouseout', '.change_left', function() {
                var job = $(this).data('job');
                $(this).removeClass('hovered');
                $(document).find('.patchset-content[data-job="'+job+'"]').removeClass('hovered');
            })

            $(document).on('mouseout', '.patchset-content', function(){
                var patchset = $(this).data('patchset');
                var change = $(this).data('change');
                var job = $(this).data('job');

                $(document).find('.patchset-content[data-change='+change+'][data-patchset='+patchset+']').removeClass('hovered');
                $(document).find('.patchset-content[data-job="'+job+'"]').removeClass('hovered');
                $(document).find('.change_left[data-job="'+job+'"]').removeClass('hovered');
                $(document).find('.patchset-header[data-change='+change+'][data-patchset='+patchset+']').removeClass('hovered');
                $(document).find('.change-header[data-change='+change+']').removeClass('hovered');
            })

            $(document).on('mouseover', '.change-header, .patchset-header', function() {
                var patchset = $(this).data('patchset');
                var change = $(this).data('change');

                $(document).find('.ci_result.result_'+change+'_'+patchset).addClass('hovered');
                $(document).find('.patchset-header[data-change='+change+'][data-patchset='+patchset+']').addClass('hovered');
                $(document).find('.change-header[data-change='+change+']').addClass('hovered');
            })

            $(document).on('mouseout', '.change-header, .patchset-header', function() {
                var patchset = $(this).data('patchset');
                var change = $(this).data('change');

                $(document).find('.ci_result.result_'+change+'_'+patchset).removeClass('hovered');
                $(document).find('.patchset-header[data-change='+change+'][data-patchset='+patchset+']').removeClass('hovered');
                $(document).find('.change-header[data-change='+change+']').removeClass('hovered');
            })

            $(window).on("scroll", function() {
                    var pos_top = $('.table-holder').offset().top;
                    if ($(window).scrollTop() > pos_top - 70) {
                        $('.table-holder .thead').addClass('fixed');
                        $('.sidepatch').removeClass('hidden');
                    } else {
                        $('.table-holder .thead').removeClass('fixed');
                        $('.sidepatch').addClass('hidden');
                    }
                }
            )

            var extrascroll =  function() {
                $scope.$emit('haveScrolled', $('.scroll-holder').scrollLeft());
            }

            $('.scroll-holder').scroll(extrascroll);

            $(document).on('mouseover', '.patchset-content', function() {
                if (!$(this).data('tooltip').length)
                    return;
                var element = $(this);
                $timeout(function() {
                    if (element.is(':hover')) {
                        var id = element.data('job') + '-' + element.data('change') + '-' + element.data('patchset');
                        if (!$('#' + id).length) {
                            var pos = element.offset();
                            var tooltip = $('<div class="jqtooltip" id="' + id + '">' + element.data('tooltip') + '</div>');
                            $('body').prepend(tooltip);

                            var t_height = tooltip.height() + 30;
                            var t_width = tooltip.width() + 30;

                            var w_width = $(window).width() - 30;

                            var top = pos.top + element.height() + 10;
                            if (top + t_height > $(window).height() + $(window).scrollTop() - 30) {
                                top = pos.top - t_height;
                            }
                            var left = pos.left + element.width() / 2 - t_width / 2;

                            if (left + t_width > w_width) {
                                left = w_width - t_width;
                            }
                            tooltip.css('top', top + 'px');
                            tooltip.css('left', left + 'px');

                            tooltip.css('opacity', 1);
                        }
                    }
                }, 100);

            })
            $(document).on('mouseout', '.patchset-content', function() {
                var element = $(this);
                $timeout(function() {
                    if (!element.is(':hover')) {
                        var id = element.data('job') + '-' + element.data('change') + '-' + element.data('patchset');
                        $('#' + id).remove();
                    }
                }, 50);

            })
        }

        var destroy = function() {
            $('window').off('scroll');
            $(document).off('mouseover', '.patchset-content');
            $(document).off('mouseover', '.change_left');
            $(document).off('mouseout', '.change_left');
            $(document).off('mouseout', '.patchset-content');
            $('.scroll-holder').off('scroll');
        }

        this.$onInit = function() {
            init();
        }

        this.$onDestroy = function() {
            destroy();
        }

        /*$scope.$on('suspend', function () {
         destroy();
         })
         $scope.$on('resume', function() {
         init();
         })*/
    }
})

gerritmetrix.directive('faSuspendable', function () {
    return {
        link: function (scope) {
            // Heads up: this might break is suspend/resume called out of order
            // or if watchers are added while suspended
            var watchers;

            scope.$on('suspend', function () {
                watchers = scope.$$watchers;
                scope.$$watchers = [];
            });

            scope.$on('resume', function () {
                if (watchers)
                    scope.$$watchers = watchers;

                // discard our copy of the watchers
                watchers = void 0;
            });
        }
    };
});