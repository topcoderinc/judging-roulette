var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var Submission = new Schema({
    team: { type: Number, unique: true },
    video: String,
    videoHtml: Schema.Types.Mixed,
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