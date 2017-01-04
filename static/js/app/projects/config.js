/**
 * Created by diana on 15.12.2016.
 */

gerritmetrix.config(['$stateProvider', '$uibTooltipProvider', function ($stateProvider, $uibTooltipProvider){
    $uibTooltipProvider.setTriggers({'mouseoverAjax': 'mouseleaveAjax'});
    $stateProvider
        .state('app.projects', {
            url: '',
            abstract: true,
            template: '<div ui-view=""></div>'
        })
        .state('app.projects.list', {
            url: '^/projects',
            templateUrl: 'static/templates/components/projects/list.html',
            controller: 'projectsCtrl',
            data: {
                displayName: 'Projects'
            },
            menu: {
                tag: 'sidebar',
                name: 'Projects',
                priority: 200
            }
        })
        .state('app.projects.detail', {
            url: '^/project/{project_name:any}',
            templateUrl: 'static/templates/components/projects/view.html',
            controller: 'projectViewCtrl',
            data: {
                displayName: 'Display'
            },
        })
        .state('app.projects.chart', {
            url: '^/project_chart/{project_name:any}',
            templateUrl: 'static/templates/components/projects/chart.html',
            controller: 'projectChartCtrl',
            data: {
                displayName: 'Display'
            },
        })
        .state('app.projects.table', {
            url: '^/project_table/{project_name:any}',
            templateUrl: 'static/templates/components/projects/table.html',
            controller: 'projectTableCtrl',
            data: {
                displayName: 'Display'
            },
        })
}]);