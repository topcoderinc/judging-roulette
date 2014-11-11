'use strict';


// Module Definition
var JudgingRouletteApp = angular.module('JudgingRouletteApp', [ 'ngRoute', 'JudgingRouletteControllers' ]);

JudgingRouletteApp.run(['$rootScope', '$location',
    function ($rootScope, $location) {

    }
]);

JudgingRouletteApp.config(function($sceProvider) {
    $sceProvider.enabled(false);
});

// Angular Route Configuration
JudgingRouletteApp.config(function ($routeProvider) {
    $routeProvider.
        when('/', {
            templateUrl : 'partials/submission-form.html',
            controller  : 'submissionFormController'
        }).
        when('/thanks', {
            templateUrl : 'partials/thanks.html',
            controller  : 'thanksController'
        }).
        when('/submissions', {
            templateUrl : 'partials/submissions.html',
            controller  : 'submissionsController'
        }).
        when('/submissions/:id', {
            templateUrl : 'partials/submission-details.html',
            controller  : 'submissionDetailsController'
        }).
        otherwise({
            redirectTo: '/'
        });
});