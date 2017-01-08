/**
 * Created by Diana on 11/16/2016.
 */
gerritmetrix.filter('first_line', function(){
    return function(input) {
        var result = input.split("\n\n");
        return result[0];
    }
})

gerritmetrix.directive('pagination', function($location) {
    return {
        templateUrl: 'static/templates/utils/pagination/pagination.html',
        link: function($scope) {
            $scope.prevPage = function() {
                $scope.skip -= $scope.limit;
                if ($scope.skip < 0)
                    $scope.skip = 0;

                var page = $scope.skip / $scope.limit + 1;
                $location.search('page', page);

                $scope.getList();

            }

            $scope.nextPage = function() {
                $scope.skip += $scope.limit;
                $scope.getList();

                var page = $scope.skip / $scope.limit + 1;
                $location.search('page', page);

            }
        }
    }
})

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function getOffset(elem) {
    var docElem, win, rect, doc;
    rect = elem.getBoundingClientRect();
    if ( rect.width || rect.height || elem.getClientRects().length ) {
        doc = elem.ownerDocument;
        win = window;
        docElem = doc.documentElement;

        return {
            top: rect.top + win.pageYOffset - docElem.clientTop,
            left: rect.left + win.pageXOffset - docElem.clientLeft
        };
    }

}

gerritmetrix.directive('d3Linechart', ['d3Service', function(d3Service){
    return {
        restrict: 'EA',
        link: function(scope, element, attrs) {
            var type = attrs.type;
            d3Service.d3().then(function (d3) {
                var svg = d3.select(element[0])
                    .append('svg')
                    .style('width', '100%').style('height', '500px');
                var WIDTH = svg.style('width').replace('px', ''), HEIGHT = 500;
                var MARGINS = {
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 50
                }

                scope.render = function(svg, type) {
                    svg.selectAll('*').remove();
                    var xScale = d3.scaleTime().range([MARGINS.left, WIDTH - MARGINS.right]).domain([new Date(scope.chart[type].start * 1000), new Date(scope.chart[type].end * 1000)]);
                    var yScale = d3.scaleLinear().range([HEIGHT - MARGINS.top, MARGINS.bottom]).domain([0, scope.chart[type].max_value]);
                    svg.append("svg:g").attr("transform", "translate(0," + (HEIGHT - MARGINS.bottom) + ")").call(d3.axisBottom(xScale).ticks(d3.timeHour.every(scope.chart[type].tick)).tickFormat(d3.timeFormat("%d/%H")));
                    svg.append("svg:g").attr("transform", "translate(" + (MARGINS.left) + ",0)").call(d3.axisLeft(yScale));

                    var lineGen = d3.line()
                        .x(function(d) {
                            return xScale(new Date(d.date * 1000));
                        })
                        .y(function(d) {
                            return yScale(d.counter);
                        }).curve(d3.curveMonotoneX);

                    var lineMouseOut = function () {
                        var item = d3.select(this);
                        //item.style("stroke-width", 2).style('z-index', 1);
                    }

                    var lineMouseOver = function() {
                        var item = d3.select(this);
                        //item.style("stroke-width", 4).style('z-index', 10);
                    }

                    var div = d3.select("body").append("div")
                        .attr("class", "tooltip")
                        .style("opacity", 0);

                    angular.forEach(scope.chart[type].list, function (list, author) {
                        var color = getRandomColor();
                        var is_individual = false;
                        var selected_author = null;
                        angular.forEach(scope.authors, function (_author) {
                            if (_author.username == author) {
                                color = _author.color;
                                selected_author = _author;
                                if (_author.individual)
                                    is_individual = true;
                            }
                        })

                        if (is_individual) {
                            angular.forEach(selected_author.jobs, function(job) {
                                svg.append('svg:path')
                                    .attr('d', lineGen(list[job.job]))
                                    .attr('stroke', job.color)
                                    .attr('stroke-width', 2)
                                    .attr('fill', 'none')
                                    .on('mouseover', lineMouseOver)
                                    .on('mouseout', lineMouseOut());

                                var divs = {}

                                svg.selectAll('dot').data(list[job.job])
                                    .enter().append('circle').attr('r', 5)
                                    .attr('cx', function(d) {
                                        var div = d3.select("body").append("div")
                                            .attr("class", "tooltip")
                                            .style("opacity", 0);
                                        divs[d.date] = div;
                                        return xScale(new Date(d.date * 1000));
                                    })
                                    .attr('cy', function (d) {
                                        return yScale(d.counter)
                                    })
                                    .on("mouseover", function(d) {
                                        divs[d.date].transition()
                                            .duration(200)
                                            .style("opacity", .9);
                                        var html = "<ul>";
                                        angular.forEach(d.results, function(result) {
                                            html += '<li>' + result.number + ' - ' + result.patchSet + '</li>';
                                        })
                                        html += '</ul>';
                                        divs[d.date].html(html)
                                            .style("left", (d3.event.pageX) + 20 + "px")
                                            .style("top", (d3.event.pageY) - 20 + "px").style('z-index', 200);
                                    })
                                    .on("mouseout", function(d) {
                                        var item = d3.select(this);
                                        if (!item.classed('clicked'))
                                            divs[d.date].transition()
                                                .duration(500)
                                                .style("opacity", 0).style('z-index', -1);
                                    })
                                    .on('click', function() {
                                        var item = d3.select(this);
                                        if (item.classed('clicked'))
                                            item.classed('clicked', false);
                                        else
                                            item.classed('clicked', true);

                                    });

                            })
                        } else {
                            svg.append('svg:path')
                                .attr('d', lineGen(list))
                                .attr('stroke', color)
                                .attr('stroke-width', 2)
                                .attr('fill', 'none')
                                .on('mouseover', lineMouseOver)
                                .on('mouseout', lineMouseOut);

                            var divs = {}

                            svg.selectAll('dot').data(list)
                                .enter().append('circle').attr('r', 5)
                                .attr('cx', function(d) {
                                    var div = d3.select("body").append("div")
                                        .attr("class", "tooltip")
                                        .style("opacity", 0);
                                    divs[d.date] = div;
                                    return xScale(new Date(d.date * 1000));
                                })
                                .attr('cy', function (d) {
                                    return yScale(d.counter)
                                })
                                .on("mouseover", function(d) {
                                    divs[d.date].transition()
                                        .duration(200)
                                        .style("opacity", .9);
                                    var html = "<ul>";
                                    angular.forEach(d.results, function(result) {
                                        html += '<li>' + result.number + ' - ' + result.patchSet + '</li>';
                                    })
                                    html += '</ul>';
                                    divs[d.date].html(html)
                                        .style("left", (d3.event.pageX) + 20 + "px")
                                        .style("top", (d3.event.pageY) - 20 + "px").style('z-index', 200);
                                })
                                .on("mouseout", function(d) {
                                    var item = d3.select(this);
                                    if (!item.classed('clicked'))
                                        divs[d.date].transition()
                                            .duration(500)
                                            .style("opacity", 0).style('z-index', -1);
                                })
                                .on('click', function() {
                                    var item = d3.select(this);
                                    if (item.classed('clicked'))
                                        item.classed('clicked', false);
                                    else
                                        item.classed('clicked', true);

                                });
                        }
                    })
                }

                scope.$watch('chart', function(newVals, oldVals) {
                    if (typeof scope.chart != 'undefined')
                        return scope.render(svg, type);
                }, true);



            })
        }
    }
}])

gerritmetrix.directive('d3Bars', ['d3Service', function(d3Service) {
    return {
        restrict: 'EA',
        link: function(scope, element, attrs) {
            d3Service.d3().then(function (d3) {
                var margin = parseInt(attrs.margin) || 20,
                    barHeight = parseInt(attrs.barHeight) || 20,
                    barPadding = parseInt(attrs.barPadding) || 5;
                var svg = d3.select(element[0])
                    .append('svg')
                    .style('width', '100%');

                // Browser onresize event
                window.onresize = function () {
                    scope.$apply();
                };

                // Watch for resize event
                scope.$watch(function () {
                    //return angular.element($window)[0].innerWidth;
                }, function () {
                    scope.render(scope.data);
                });

                scope.render = function (data) {
                    svg.selectAll('*').remove();

                    // If we don't pass any data, return out of the element
                    if (!data) return;

                    // setup variables
                    var width = d3.select(element[0]).node().offsetWidth - margin,
                        // calculate the height
                        height = scope.data.length * (barHeight + barPadding),
                        // Use the category20() scale function for multicolor support
                        color = d3.scale.category20(),
                        // our xScale
                        xScale = d3.scale.linear()
                            .domain([0, d3.max(data, function(d) {
                                return d.score;
                            })])
                            .range([0, width]);

                    // set the height based on the calculations above
                    svg.attr('height', height);

                    //create the rectangles for the bar chart
                    svg.selectAll('rect')
                        .data(data).enter()
                        .append('rect')
                        .attr('height', barHeight)
                        .attr('width', 140)
                        .attr('x', Math.round(margin/2))
                        .attr('y', function(d,i) {
                            return i * (barHeight + barPadding);
                        })
                        .attr('fill', function(d) { return color(d.score); })
                        .transition()
                        .duration(1000)
                        .attr('width', function(d) {
                            return xScale(d.score);
                        });
                    svg.selectAll('text')
                        .data(data)
                        .enter()
                        .append('text')
                        .attr('fill', '#fff')
                        .attr('y', function(d,i) {
                            return i * (barHeight + barPadding) + 15;
                        })
                        .attr('x', 15)
                        .text(function(d) {
                            return d.name + " (" + d.score + ")";
                        });
                }
            });
        }}
}]);

gerritmetrix.directive('gerritComment', function() {
    return {
        templateUrl: 'static/templates/utils/comment/comment.html',
        link: function(scope, iElement, iAttrs) {
            scope.$watch(iAttrs.comment, function(comment){
                scope.author = comment.author;
                scope.approvals = comment.approvals;
                scope.comment_text = comment.comment;
                scope.eventCreatedOn = comment.eventCreatedOn;
                scope.skip = comment.skip;

                var split_comm = comment.comment.split('\n');

                if (!split_comm[2].match(/^Build (.*)/)) {
                    scope.skip = true;
                    return;
                } else {
                    var build_result = split_comm[2].match(/Build ([a-zA-Z]+)(\s\(([a-zA-Z]+)\spipeline\))?/);
                    scope.result = {
                        build_result: build_result[1],
                        pipeline: build_result[3]
                    }
                }

                //check for vote
                var regex = "Patch Set " + comment.patchSet.number + ":[\\s]?(Verified([+,-]?)([0-9]))?";
                var re = RegExp(regex);
                var verified = split_comm[0].match(re);
                scope.verified = (typeof verified[1] != 'undefined'?{input: verified[1], class: (verified[2] == '+'?'success':'danger'), grade: verified[3]}:false);

                scope.ci_list = [];
                for (i = 4; i < split_comm.length; i++) {
                    if (split_comm[i]) {
                        var regex = '[-*]\\s([-_a-zA-Z0-9]+)\\s([-a-zA-Z0-9@:%_\\+.~#?&//=]*)\\s:\\s([A-Za-z]+)[\\s]?(.*)?'
                        var re = RegExp(regex);
                        var result = split_comm[i].match(re);

                        if (result == null)
                            continue;

                        var ci = {
                            name: result[1],
                            link: result[2],
                            class: (result[3] == 'SUCCESS' ? 'success' : 'danger'),
                            result: result[3],
                            extra: result[4]
                        }
                        scope.ci_list.push(ci);
                    }
                }

            });
        }
    }
})

gerritmetrix.directive('activity', [
    function () {
        return {
            restrict: 'EA',
            templateUrl: 'static/templates/utils/activity.html',
            replace: true,
            scope: {
                message: '@'
            },
            link: function (scope, element, attrs) {}
        };
    }
]);