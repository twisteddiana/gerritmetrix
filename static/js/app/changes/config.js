/**
 * Created by diana on 17.12.2016.
 */

gerritmetrix.config(['$stateProvider', function ($stateProvider){
    $stateProvider
        .state('app.changes', {
            url: '^/changes',
            templateUrl: 'static/templates/components/changes/list.html',
            controller: 'changesCtrl',
            data: {
                displayName: 'Changes'
            },
            menu: {
                tag: 'sidebar',
                name: 'Changes',
                priority: 200
            }
        })
        .state('app.change', {
            url: '^/change/{change_number:any}',
            templateUrl: 'static/templates/components/changes/view.html',
            controller: 'changeCtrl',
            data: {
                displayName: 'Change'
            },
        })
}]);