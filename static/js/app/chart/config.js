gerritmetrix.config(['$stateProvider', function ($stateProvider){
    $stateProvider
        .state('app.chart', {
            url: '^/chart',
            templateUrl: 'static/templates/components/chart/view.html',
            controller: 'chartCtrl',
            data: {
                displayName: 'CHART'
            },
            menu: {
                tag: 'sidebar',
                name: 'CHART',
                priority: 200
            }
        })
}]);