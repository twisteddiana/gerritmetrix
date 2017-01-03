/**
 * Created by Diana on 11/12/2016.
 */

gerritmetrix.config(function ($stateProvider){
    $stateProvider
        .state('app', {
            abstract: true,
            data: {
                displayName: 'Home'
            },
            views: {
                'header@app': {
                    templateUrl: 'static/templates/utils/header.html'
                },
                'menu@app': {
                    templateUrl: 'static/templates/utils/menu/menu.html'
                },
                '': {
                    templateUrl: 'static/templates/utils/index.html'
                }
            }
        })
        .state('app.404',  {
            url: '^/404',
            templateUrl: 'static/templates/utils/404.html',

        })
});
