'use strict';


// Factories for JudgingRouletteApp
JudgingRouletteControllers.factory('JudgingRouletteFactory', function($http, $q, $timeout) {
    return {
        getSubmission: function () {
            var deferred = $q.defer();
            $http({
                method: 'GET',
                url: '/get-submission'
            }).success(function (result) {
                deferred.resolve(result);
            }).error(function (result) {
                deferred.resolve(result);
            });
            return deferred.promise;
        },
        submitReview: function (submission, review) {
            var deferred = $q.defer();
            $http({
                method: 'POST',
                url: '/submit-review',
                data: { submission: submission, review: review }
            }).success(function (result) {
                deferred.resolve(result);
            }).error(function (result) {
                deferred.resolve(result);
            });
            return deferred.promise;
        },
        getSubmissions: function () {
            var deferred = $q.defer();
            $http({
                method: 'GET',
                url: '/get-submissions'
            }).success(function (result) {
                deferred.resolve(result);
            }).error(function (result) {
                deferred.resolve(result);
            });
            return deferred.promise;
        },
        calculateScores: function () {
            var deferred = $q.defer();
            $http({
                method: 'GET',
                url: '/calculate-scores'
            }).success(function (result) {
                deferred.resolve(result);
            }).error(function (result) {
                deferred.resolve(result);
            });
            return deferred.promise;
        },
        getSubmissionDetails: function (teamNumber){
            var deferred = $q.defer();
            $http({
                method: 'GET',
                url: '/submission-details/' + teamNumber
            }).success(function (result) {
                deferred.resolve(result);
            }).error(function (result) {
                deferred.resolve(result);
            });
            return deferred.promise;
        },
        addToSubmissions: function (teamNumber, videoUrl) {
            var deferred = $q.defer();
            $http({
                method: 'POST',
                url: '/create-submission',
                data: { team: teamNumber, video: videoUrl }
            }).success(function (result) {
                deferred.resolve(result);
            }).error(function (result) {
                deferred.resolve(result);
            });
            return deferred.promise;
        }
    }

});