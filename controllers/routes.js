var isJudgingEnabled = process.env.ENABLE_JUDGING ? true : false;
var config = require('../config/config');
var Submission = require('../models/Submission');
var async = require('async');
var cheerio = require('cheerio');
var request = require('request');

exports.logout = function(req, res){
    req.logOut();
    res.redirect('https://www.topcoder.com/?action=showlogin');
}

// Views
exports.index = function (req, res) {
    var user = '';
    if (req.user) {
        user = JSON.stringify(req.user);
    }
    res.render('index', {
        title: 'Home | Judging Roulette',
        eventTitle: process.env.EVENT,
        user: user,
        judging: isJudgingEnabled
    });
};

// REST endpoint for creating submission records
exports.createSubmission = function (req, res) {
    if(!req.body.team || !req.body.video ){
        return res.status(400).send({ error: 'Validation error!' });
    }

    var teamNumber = req.body.team;
    var videoUrl = req.body.video;
    var videoHtml = '';

    // Screencast.com
    if(videoUrl.indexOf('screencast.com') > -1){
        request(videoUrl, function callback(error, response, body) {
            if(!error && response.statusCode === 200){
                var $ = cheerio.load(body, {
                    ignoreWhitespace: true
                });
                videoHtml = $('div[id=mediaDisplayArea]').html();
                save();
            }else{
                res.status(500).send({ error: error });
            }
        });

    // Youtube
    }else if(videoUrl.indexOf('youtube.com') > -1 || videoUrl.indexOf('youtu.be') > -1){
        save();

    // Vimeo
    }else if(videoUrl.indexOf('vimeo.com') > -1){
        save();
    }

    function save(){
        var submission = new Submission({
            team: teamNumber,
            video: videoUrl,
            videoHtml: videoHtml,
            totalReviews: 0
        });

        submission.save(function (err, result) {
            if (!err) {
                return res.status(200).send({ success: result });
            } else {
                if (err.name == 'ValidationError') {
                    res.status(400).send({ error: err });
                } else {
                    res.status(500).send({ error: err });
                }
            }
        });
    }
}

// Route for getting the random, least reviewed video for the Submissions Form page
exports.getSubmission = function (req, res) {
    var handle = req.user.id;

    Submission.find({})
        .sort({ totalReviews: -1 })
        .exec(function (err, submissions) {
            if (!err) {
                if (submissions.length == 0) {
                    return res.status(404).send({ error: 'Not found' });
                } else {

                    var removals = [];
                    var newSubmissions = [];
                    // Removes the submissions, those has been already reviewed by the User
                    for(var i = 0; i < submissions.length; i++){
                        for(var j = 0; j < submissions[i].reviews.length; j++){
                            if(submissions[i].reviews[j].handle == handle){
                                removals.push(i);
                            }
                        }
                    }

                    for(var i = 0; i < submissions.length; i++){
                        if(removals.indexOf(i) == -1){
                            newSubmissions.push(submissions[i]);
                        }
                    }

                    // Get randomCount from config
                    var maxValue = config.randomCount < newSubmissions.length ? config.randomCount : newSubmissions.length;

                    // Generate random number between 0-maxValue
                    var arrIndex = Math.floor((Math.random()*maxValue-1)+1);

                    // Random submission from "randomCount" number of lowest watched videos
                    var submission = newSubmissions[arrIndex];

                    return res.status(200).send({ success: {
                        submission: submission,
                        questions: config.questions
                    }});
                }
            } else {
                return res.status(500).send({ error: err });
            }
        });
}

// Saves the submitted review
exports.submitReview = function(req, res){
    if(!req.body.submission || !req.body.review){
        return res.status(400).send({ error: 'Validation Error' });
    }

    Submission.findOne({ _id: req.body.submission._id }, function(err, submission){
        if(err){
            return res.status(500).send({ error: err });
        }

        // Increases the totalReview Count
        submission.totalReviews += 1;

        // Pushes the new review
        submission.reviews.push(req.body.review);

        submission.save(function (err, result) {
            if (!err) {
                return res.status(200).send({ success: result });
            } else {
              console.log(err);
                if (err.name == 'ValidationError') {
                    res.status(400).send({ error: err });
                } else {
                    res.status(500).send({ error: err });
                }
            }
        });
    });
}

exports.getSubmissions = function (req, res) {
    Submission.find({event: process.env.EVENT})
        .sort({ score: -1 })
        .limit(25)
        .exec(function (err, submissions) {
            if (!err) {
                if (submissions.length == 0) {
                    return res.status(404).send({ error: 'Not found' });
                } else {
                    return res.status(200).send({ success: submissions });
                }
            } else {
                return res.status(500).send({ error: err });
            }
        });
}

exports.calculateScores = function (req, res) {
    Submission.find({})
        .exec(function (err, submissions) {
            if (!err) {
                if (submissions.length == 0) {
                    return res.status(404).send({ error: 'Not found' });
                } else {
                    calculateAndUpdate(submissions);
                }
            } else {
                return res.status(500).send({ error: err });
            }
        });

    // Logic for calculating the scores
    function calculateAndUpdate(submissions){
        async.each(submissions, function(submission, callback) {
            var reviews = submission.reviews;
            var totalScoreFromAllJudges = 0;

            for(var j = 0; j < reviews.length; j++){
                var review = reviews[j];
                var scores = review.scores;

                var totalScoreFromSingleJudge = 0;
                for(var k = 0; k < scores.length; k++){
                    var score = scores[k].score;
                    totalScoreFromSingleJudge += score;
                }
                totalScoreFromSingleJudge = totalScoreFromSingleJudge / scores.length;
                totalScoreFromAllJudges += totalScoreFromSingleJudge;
            }

            if(reviews.length > 0){
                totalScoreFromAllJudges = totalScoreFromAllJudges / reviews.length;
                submission.score = totalScoreFromAllJudges/4*100;

                submission.save(function (err, result) {
                    if (!err) {
                        callback();
                    } else {
                        callback(err);
                    }
                });
            }else{
                callback();
            }
        }, function(err){
            if (!err) {
                return res.status(200).send({ success: '' });
            } else {
                return res.status(500).send({ error: err });
            }
        });
    }

}

exports.getSubmissionDetails = function(req, res){
    if(!req.params.id){
        return res.status(400).send({ error: 'Validation error!' });
    }
    Submission.findById(req.params.id, function(err, submission) {
        if (!err && submission) {
            return res.status(200).send({ success: submission });
        } else {
            return res.status(500).send({ error: 'Not found!' });
        }

    });
}
