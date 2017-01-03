/**
 * Created by diana on 21.12.2016.
 */
gerritmetrix.factory('CI', ['$http', function($http) {
    return {
        get: function (data) {
            return $http.post('/cis', data);
        },
        getJobs: function(data) {
            return $http.post('/ci', data);
        },
        getAuthors: function(piece, project) {
            return $http.post('/authors', {piece: piece, project: project});
        }
    }
}])