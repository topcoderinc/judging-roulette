var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var Submission = new Schema({
    event: { type: String, required: true},
    team: { type: String, required: true },
    teamName: { type: String, required: true},
    repoUrl: { type: String, required: true},
    video: String,
    videoHtml: Schema.Types.Mixed,
    comments: String,
    totalReviews: Number,
    score: Number,
    reviews: [{
        handle: String,
        date: Date,
        scores: [{
            question: String,
            score: Number
        }],
        feedback: String
    }],
    created: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Submission', Submission);
