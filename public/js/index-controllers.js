'use strict';


// Controllers for JudgingRouletteApp
var JudgingRouletteControllers = angular.module('JudgingRouletteControllers', ['ngCookies']);

// Main Controller
JudgingRouletteControllers.controller('mainController', ['$scope', '$http', '$timeout', '$rootScope', '$cookieStore', '$location', 'JudgingRouletteFactory',
    function($scope, $http, $timeout, $rootScope, $cookieStore, $location, JudgingRouletteFactory) {
        $rootScope.User = User;
        $('#profile-picture').attr('src', User.picture);
        $('#profile-handle').text(User.id);
    }
]);

JudgingRouletteControllers.controller('submissionFormController', ['$scope', '$http', '$timeout', '$rootScope', '$cookieStore', '$location', '$route', 'JudgingRouletteFactory',
    function($scope, $http, $timeout, $rootScope, $cookieStore, $location, $route, JudgingRouletteFactory) {
        if(Judging != true){
            return $location.url('/thanks');
        }

        $scope.Submission = {};
        $scope.Questions = [];
        $scope.Scores = [];
        $scope.videoProvider = '';
        JudgingRouletteFactory.getSubmission().then(function(result){
            if(!result.error){
                $scope.Submission = result.success.submission;
                $scope.Questions = result.success.questions;

                for(var i = 0; i < $scope.Questions.length; i++){
                    $scope.Scores[i] = {};
                }

                if(!$scope.Submission){
                    document.querySelector('#toast-all-done').show();
                    $location.url('/thanks');
                    return;
                }

                var videoUrl = $scope.Submission.video;
                var arr = [];
                var videoId = '';
                // Screencast.com
                if(videoUrl.indexOf('screencast.com') > -1){
                    $scope.videoProvider = 'screencast';
                    $scope.Submission.videoHtml.replace('FirstFrame.jpg', 'FirstFrame.jpg&autostart=true');
                    $('#embed-screencast').html($scope.Submission.videoHtml);

                // Youtube
                }else if(videoUrl.indexOf('youtube.com') > -1){
                    $scope.videoProvider = 'youtube';
                    var videoId = getParameterByName('v', videoUrl);
                    $('#embed-youtube').attr('src', '//www.youtube.com/embed/' + videoId + '?autoplay=1');

                // Youtube Shortened
                }else if(videoUrl.indexOf('//youtu.be') > -1){
                    $scope.videoProvider = 'youtube';
                    arr = videoUrl.split("/");
                    videoId = arr[arr.length-1];
                    $('#embed-youtube').attr('src', '//www.youtube.com/embed/' + videoId + '?&autoplay=1');
                    console.log(videoUrl);
                // Vimeo
                }else if(videoUrl.indexOf('vimeo.com') > -1){
                    $scope.videoProvider = 'vimeo';
                    arr = videoUrl.split("/");
                    videoId = arr[arr.length-1];
                    $('#embed-vimeo').attr('src', '//player.vimeo.com/video/' + videoId + '?title=0&amp;byline=0&amp;portrait=0&amp;color=ff9933&amp;autoplay=1&amp;loop=1');
                }
            }
        });

        $scope.showQuestions = false;

        $scope.skip = function(){
            $route.reload();
        }

        $scope.review = function(){
            $('#video-wrap').removeClass('col-md-10 col-md-offset-1');
            $('#video-wrap').addClass('col-md-5');
            $scope.showQuestions = true;

            // Dynamically change size of Screencast video
            var scHtml = $('#embed-screencast').html();
            $('#embed-screencast').html(scHtml);
        }

        $scope.selectScores = function(questionNumber){
            setTimeout(function() {
               grabScore(questionNumber);
            }, 100);
        }

        function grabScore(questionNumber){
            $.each($('#question-' + questionNumber).children('paper-radio-button'), function (index, elem) {
                if (elem.getAttribute('aria-checked') == 'true') {
                    var value = parseInt(elem.getAttribute('name'));
                    $scope.Scores[questionNumber] = {
                        question: $scope.Questions[questionNumber],
                        score: value
                    };
                }
            });
        }

        $scope.submitReview = function(){
            var feedback = $('#feedback-text').val();
            for(var i in $scope.Scores){
                if(!$scope.Scores[i].score){
                    document.querySelector('#toast-all-questions').show();
                    return;
                }
            }

            var review = {
                handle: User.id,
                date: new Date(),
                scores: $scope.Scores,
                feedback: feedback
            };

            JudgingRouletteFactory.submitReview($scope.Submission, review).then(function(result){
                if(!result.error){
                    $route.reload();
                }else{
                    document.querySelector('#toast-submit-error').show();
                }
            });
        }

    }
]);

JudgingRouletteControllers.controller('submissionsController', ['$scope', '$http', '$timeout', '$rootScope', '$cookieStore', '$location', 'JudgingRouletteFactory',
    function($scope, $http, $timeout, $rootScope, $cookieStore, $location, JudgingRouletteFactory) {
        if(!$rootScope.User.isAdmin){
            return $location.url('/');
        }

        $scope.calculateScores = function(){
            document.querySelector('#toast-loading').show();
            JudgingRouletteFactory.calculateScores().then(function(result){
                if(!result.error){
                    getSubmissions();
                }else{
                    document.querySelector('#toast-calculate-error').show();
                }
            });
        }

        $scope.Submissions = [];
        function getSubmissions(){
            JudgingRouletteFactory.getSubmissions().then(function(result){
                if(!result.error){
                    $scope.Submissions = result.success;
                }
            });
        }
        getSubmissions();

        $scope.submitSubmission = function(){
            var teamNumber = parseInt($('#team-number').val());
            var videoUrl = $('#video-url').val();

            if(isNaN(teamNumber)){
                return document.querySelector('#toast-team-error').show();
            }else if(videoUrl.indexOf('youtube.com') == -1 && videoUrl.indexOf('//youtu.be') == -1 && videoUrl.indexOf('vimeo.com') == -1 && videoUrl.indexOf('screencast.com') == -1){
                return document.querySelector('#toast-video-error').show();
            }

            JudgingRouletteFactory.addToSubmissions(teamNumber, videoUrl).then(function(result){
                if(!result.error){
                    $('#createModal').modal('hide');
                    getSubmissions();
                }else{
                    if(result.error.code == 11000){
                        document.querySelector('#toast-submit-error').show();
                    }
                    if(typeof result.error == 'string'){
                        document.querySelector('#toast-submit-error').show();
                    }
                }
            });
        }
    }
]);

JudgingRouletteControllers.controller('submissionDetailsController', ['$scope', '$http', '$timeout', '$rootScope', '$cookieStore', '$location', '$routeParams', 'JudgingRouletteFactory',
    function($scope, $http, $timeout, $rootScope, $cookieStore, $location, $routeParams, JudgingRouletteFactory) {
        if(!$rootScope.User.isAdmin){
            return $location.url('/');
        }

        var teamNumber = $routeParams.id;

        $scope.SubmissionDetails = {};
        $scope.videoProvider = '';
        JudgingRouletteFactory.getSubmissionDetails(teamNumber).then(function(result){
            if(!result.error){
                $scope.SubmissionDetails = result.success;
                var videoUrl = $scope.SubmissionDetails.video;

                // Screencast.com
                if(videoUrl.indexOf('screencast.com') > -1){
                    $scope.videoProvider = 'screencast';
                    $('#embed-screencast').html($scope.SubmissionDetails.videoHtml);

                // Youtube
                }else if(videoUrl.indexOf('youtube.com') > -1){
                    $scope.videoProvider = 'youtube';
                    var videoId = getParameterByName('v', $scope.SubmissionDetails.video);
                    $('#embed-youtube').attr('src', '//www.youtube.com/embed/' + videoId + '?autoplay=1');

                // Youtube Shortened
                }else if(videoUrl.indexOf('//youtu.be') > -1){
                    $scope.videoProvider = 'youtube';
                    var arr = videoUrl.split("/");
                    var videoId = arr[arr.length-1];
                    $('#embed-youtube').attr('src', '//www.youtube.com/embed/' + videoId + '?autoplay=1');

                // Vimeo
                }else if(videoUrl.indexOf('vimeo.com') > -1){
                    $scope.videoProvider = 'vimeo';
                    var arr = videoUrl.split("/");
                    var videoId = arr[arr.length-1];
                    $('#embed-vimeo').attr('src', '//player.vimeo.com/video/' + videoId + '?title=0&amp;byline=0&amp;portrait=0&amp;color=ff9933&amp;autoplay=1&amp;loop=1');
                }
            }else{
                $location.url('/submissions');
            }
        });

        $scope.back = function(){
            $location.url('/submissions');
        }
    }
]);

JudgingRouletteControllers.controller('thanksController', ['$scope', '$http', '$timeout', '$rootScope', '$cookieStore', '$location', 'JudgingRouletteFactory',
    function($scope, $http, $timeout, $rootScope, $cookieStore, $location, JudgingRouletteFactory) {

    }
]);