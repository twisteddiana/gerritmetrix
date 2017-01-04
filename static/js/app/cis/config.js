/**
 * Created by diana on 21.12.2016.
 */
gerritmetrix.config(['$stateProvider', function ($stateProvider){
    $stateProvider
        .state('app.cis', {
            url: '^/cis',
            templateUrl: 'static/templates/components/cis/list.html',
            controller: 'cisCtrl',
            data: {
                displayName: 'CIs'
            },
            menu: {
                tag: 'sidebar',
                name: 'CIs',
                priority: 200
            }
        })
        .state('app.ci', {
            url: '^/ci/{name:any}',
            templateUrl: 'static/templates/components/cis/view.html',
            controller: 'ciCtrl',
            data: {
                displayName: 'Change'
            },
        })
}]);