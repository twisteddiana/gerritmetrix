/**
 * Created by Diana on 11/12/2016.
 */


angular.module('d3', [])
  .factory('d3Service', ['$document', '$q', '$rootScope',
    function($document, $q, $rootScope) {
      var d = $q.defer();
      function onScriptLoad() {
        // Load client in the browser
        $rootScope.$apply(function() { d.resolve(window.d3); });
      }
      // Create a script tag with d3 as the source
      // and call our onScriptLoad callback when it
      // has been loaded
      var scriptTag = $document[0].createElement('script');
      scriptTag.type = 'text/javascript';
      scriptTag.async = true;
      scriptTag.src = 'http://d3js.org/d3.v4.min.js';
      scriptTag.onreadystatechange = function () {
        if (this.readyState == 'complete') onScriptLoad();
      }
      scriptTag.onload = onScriptLoad;

      var s = $document[0].getElementsByTagName('body')[0];
      s.appendChild(scriptTag);

      return {
        d3: function() { return d.promise; }
      };
}]);

var gerritmetrix = angular.module('gerritmetrix', ['ui.router', 'ui.router.menus', 'ui.mask', 'oitozero.ngSweetAlert', 'ngCookies', 'd3', 'ui.bootstrap', 'ngSanitize', 'ui.sortable']);
gerritmetrix.run(['$rootScope', '$location', function ($rootScope, $location) {
    if ($location.path() == '')
        $location.path('/dashboard');

}]);
