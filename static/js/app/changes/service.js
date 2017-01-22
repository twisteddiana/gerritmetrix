/**
 * Created by diana on 17.12.2016.
 */
gerritmetrix.factory('Changes', ['$http', function($http) {
    return {
        get: function (data) {
            return $http.post('/changes', data);
        },
        getChange: function(change_number) {
            return $http.post('/change', {change_number: change_number});
        },
        getChart: function(data) {
            return $http.post('/change_chart', data);
        },
    }
}])