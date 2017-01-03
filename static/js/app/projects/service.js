/**
 * Created by diana on 15.12.2016.
 */
gerritmetrix.factory('Projects', ['$http', function($http) {
    return {
        get: function (data) {
            return $http.post('/projects', data);
        },
        getChanges: function(data) {
            return $http.post('/project', data);
        },
        getChart: function(data) {
            return $http.post('/project_chart', data);
        }
    }
}])
