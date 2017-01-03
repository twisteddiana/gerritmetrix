/**
 * Created by diana on 22.12.2016.
 */

gerritmetrix.controller('chartCtrl', ['$scope', '$http', '$state', 'SweetAlert', 'CI', '$location', '$stateParams', function($scope, $http, $state, SweetAlert, CI, $location, $stateParams) {
    $scope.data = [
        {name: "Greg", score: 98},
        {name: "Ari", score: 96},
        {name: 'Q', score: 75},
        {name: "Loser", score: 48}
    ];

    $scope.dataline = [{
        "sale": "202",
        "year": "2000"
    }, {
        "sale": "215",
        "year": "2001"
    }, {
        "sale": "179",
        "year": "2002"
    }, {
        "sale": "199",
        "year": "2003"
    }, {
        "sale": "134",
        "year": "2003"
    }, {
        "sale": "176",
        "year": "2010"
    }];
}])