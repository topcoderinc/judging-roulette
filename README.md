# Judging Roulette

A Node.js application using MongoDB for TCO14. Automatically logs a user in with their topcoder account if cookie found.

## Submission Model

```
{
    team: { type: Number, unique: true },
    video: String,
    videoHtml: Schema.Types.Mixed,  // Required only for Screencast.com videos
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
}
```

## Local Development

Right now there's is no way to authenticate easily against topcoder. Therefore, the code looks for their tcjwt cookie and if found, creates a user in Mongo and logs them into the app. You'll need to set the cookie locally with the following from Chrome Dev Console:

```
$.cookie('tcjwt','THE-VALUE-OF-THE-COOKIE')
```

Start MondoDB and and replace your Mongo URI in "config/config.json : db"
This App requires an environment variable "ENABLE_JUDGING" to be set to true/false

```
npm install
bower install
source environment.sh
npm start
```

## Heroku

[http://judging-roulette.herokuapp.com](http://judging-roulette.herokuapp.com)

- Screencast.com videos may not be playable over https, until you allow explicitly from the browser. Unfortunately I couldn't find any workaround for this one.
- You can set the "Admin Handles" and "Questions" in the "config/config.json" file
- I have used the [Polymer Library](https://www.polymer-project.org/) to add nice visual effects. :)