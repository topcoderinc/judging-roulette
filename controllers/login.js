var Q = require("q");
var request = require('request');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy({ usernameField: 'email' }, function (tcjwt, fakePassword, done) {
    fetchProfile(tcjwt)
        .then(function (user) {
            return done(null, user);
        })
        .fail(function (err) {
            return done(null, false, { message: 'Invalid cookie.' });
        });
}));

passport.serializeUser(function(user, done){
    done(null, user);
});

passport.deserializeUser(function(user, done){
    done(null, user);
});

var fetchProfile = function (tcjwt) {
    var deferred = Q.defer();
    var options = {
        url: 'http://api.topcoder.com/v2/user/profile',
        headers: {
            'Authorization': 'Bearer ' + tcjwt
        }
    };
    request(options, function callback(error, response, body) {
        var payload = JSON.parse(body);
        if (payload.error) deferred.reject(payload.error);
        if (!payload.error) {
            var payload = JSON.parse(body);
            var picture = 'http://community.topcoder.com' + payload.photoLink;
            if (picture === 'http:/community.topcoder.com') {
                picture = 'http://3a72mb4dqcfnkgfimp04jgyyd.wpengine.netdna-cdn.com/wp-content/themes/tcs-responsive/i/default-photo.png';
            }

            var user = {
                email: payload.emails[0].email,
                id: payload.handle,
                picture: picture,
                country: payload.country,
                password: ' ',
                isAdmin: false
            };

            // If handle is in the Admin array
            var config = require('../config/config');
            if(config.adminHandles && config.adminHandles.length != 0){
                if(config.adminHandles.indexOf(payload.handle) > -1){
                    user.isAdmin = true;
                }
            }else{
                console.log('No admin handles has been set. Please set them in "config/config.json"');
            }

            request('http://api.topcoder.com/v2/users/' + payload.handle, function callback(error, response, body) {
                var pld = JSON.parse(body);
                if (pld.error) deferred.reject(pld.error);
                if (!pld.error) {
                    var memberSince = new Date(pld.memberSince);
                    var now = new Date();
                    now.setTime(now.getTime() - 1000*60*60*24*30);  // Before 30 days

                    if(memberSince < now){
                        user.eligibleForJudging = true;
                    }else{
                        user.eligibleForJudging = false;
                    }
                    user.memberSince = pld.memberSince;

                    deferred.resolve(user);
                }
            });
        }
    });
    return deferred.promise;
}