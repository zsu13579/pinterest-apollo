/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

/**
 * Passport.js reference implementation.
 * The database schema used in this sample is available at
 * https://github.com/membership/membership.db/tree/master/postgres
 */

import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GithubStrategy } from 'passport-github';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { User, UserLogin, UserClaim, UserProfile } from '../data/models';
import { auth as config } from '../config';
import db from '../data/db';
import bcrypt from 'bcryptjs';


/**
 * Sign in with local.
 */
// Configure the local strategy for use by Passport.
//
// The local strategy require a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.
passport.use(new LocalStrategy(
  
  function(username, password, cb) {
	User.findOne({ where: { email: username } }).then(function(user){
	
    let userjson = JSON.parse(JSON.stringify(user));
	console.log(username)
	console.log(password)
	console.log(userjson)
  	if (!userjson) { return cb(null, false); }
  	if (!bcrypt.compareSync(password, userjson.password)) { return cb(null, false); }
  	return cb(null, userjson);
  	});
	
  }));


// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function(key, cb) {
  User.findOne({ id: id }, function (err, user) {
    if (err) { return cb(err); }
    cb(null, user);
  });
});


/**
 * Sign in with Github.
 */
passport.use(new GithubStrategy({
  clientID: config.github.id,
  clientSecret: config.github.secret,
  callbackURL: '/login/github/return',
  profileFields: ['name', 'email', 'link', 'locale', 'timezone'],
  passReqToCallback: true,
}, (req, accessToken, refreshToken, profile, done) => {
  /* eslint-disable no-underscore-dangle */
  const loginName = 'Jacklv';
  const claimType = 'urn:github:access_token';
  const fooBar = async () => {
	const user1 = await User.findAll({id: profile.id});
	if(user1.length){
    done(null, JSON.parse(JSON.stringify(user1[0])));
  }else{
	const user = await User.create({
	  id: profile.id,
	  email: profile.username,
	  logins: [
		{ name: loginName, key: profile.id },
	  ],
	  claims: [
		{ type: claimType, value: profile.id },
	  ],
	  profile: {
		displayName: profile.login,
		picture: profile.avatar_url,
	  },
	}, {
	  include: [
		{ model: UserLogin, as: 'logins' },
		{ model: UserClaim, as: 'claims' },
		{ model: UserProfile, as: 'profile' },
	  ],
	});
	done(null, {
          id: user.id,
          email: user.email,
        });
  }; 
  };
  fooBar().catch(done);
}));

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function(key, cb) {
  User.findOne({ id: id }, function (err, user) {
    if (err) { return cb(err); }
    cb(null, user);
  });
});

/**
 * Sign in with Facebook.
 */
passport.use(new FacebookStrategy({
  clientID: config.facebook.id,
  clientSecret: config.facebook.secret,
  callbackURL: '/login/facebook/return',
  profileFields: ['name', 'email', 'link', 'locale', 'timezone'],
  passReqToCallback: true,
}, (req, accessToken, refreshToken, profile, done) => {
  /* eslint-disable no-underscore-dangle */
  const loginName = 'Jacklv';
  const claimType = 'urn:facebook:access_token';
  const fooBar = async () => {
    if (req.user) {
      const userLogin = await UserLogin.findOne({
        attributes: ['name', 'key'],
        where: { name: loginName, key: profile.id },
      });
      if (userLogin) {
        // There is already a Facebook account that belongs to you.
        // Sign in with that account or delete it, then link it with your current account.
        done();
      } else {
        const user = await User.create({
          id: req.user.id,
          email: profile._json.email,
          logins: [
            { name: loginName, key: profile.id },
          ],
          claims: [
            { type: claimType, value: profile.id },
          ],
          profile: {
            displayName: profile.displayName,
            gender: profile._json.gender,
            picture: `https://graph.facebook.com/${profile.id}/picture?type=large`,
          },
        }, {
          include: [
            { model: UserLogin, as: 'logins' },
            { model: UserClaim, as: 'claims' },
            { model: UserProfile, as: 'profile' },
          ],
        });
        done(null, {
          id: user.id,
          email: user.email,
        });
      }
    } else {
      const users = await User.findAll({
        attributes: ['id', 'email'],
        where: { '$logins.name$': loginName, '$logins.key$': profile.id },
        include: [
          {
            attributes: ['name', 'key'],
            model: UserLogin,
            as: 'logins',
            required: true,
          },
        ],
      });
      if (users.length) {
        done(null, users[0]);
      } else {
        let user = await User.findOne({ where: { email: profile._json.email } });
        if (user) {
          // There is already an account using this email address. Sign in to
          // that account and link it with Facebook manually from Account Settings.
          done(null);
        } else {
          user = await User.create({
            email: profile._json.email,
            emailConfirmed: true,
            logins: [
              { name: loginName, key: profile.id },
            ],
            claims: [
              { type: claimType, value: accessToken },
            ],
            profile: {
              displayName: profile.displayName,
              gender: profile._json.gender,
              picture: `https://graph.facebook.com/${profile.id}/picture?type=large`,
            },
          }, {
            include: [
              { model: UserLogin, as: 'logins' },
              { model: UserClaim, as: 'claims' },
              { model: UserProfile, as: 'profile' },
            ],
          });
          done(null, {
            id: user.id,
            email: user.email,
          });
        }
      }
    }
  };

  fooBar().catch(done);
}));

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function(key, cb) {
  User.findOne({ id: id }, function (err, user) {
    if (err) { return cb(err); }
    cb(null, user);
  });
});

export default passport;
