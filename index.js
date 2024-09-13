const express = require('express');
const session = require('express-session');
const app = express();
const axios = require('axios');
const passport = require('passport');
const githubStrategy = require('passport-github2').Strategy;
require('dotenv').config();

app.use(express.static(__dirname + '/public'));

passport.use(new githubStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'https://byte-tasks-arpan.onrender.com/auth/github/callback',
}, (accessToken, refreshToken, profile, done) => {
    profile.accessToken = accessToken;
    // console.log(accessToken, refreshToken, profile) 
    return done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user);
  });
  
passport.deserializeUser((obj, done) => {
    done(null, obj);
  });

app.use(session({ 
    secret: process.env.SESSION_SECRET, 
    resave: false, 
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: true, // NOTE TO SELF: set to true before deploying
        maxAge: 24 * 60 * 60 * 1000
    },
}));

app.use(passport.initialize());
app.use(passport.session());

const checkIfFollowing = async (req, res, next) => {
    if (!req.isAuthenticated() || !req.user) {
        return res.sendFile(__dirname + "/public/notAuthenticated.html");
    }

    const accessToken = req.user.accessToken;  
    const url = 'https://api.github.com/user/following/bytemait';

    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `token ${accessToken}`,  
                Accept: 'application/vnd.github.v3+json',
            },
        });
        if (response.status === 204) {
            return next(); 
        } else {
            return res.sendFile(__dirname + "/public/forbidden.html");
        }
    } catch (error) {
        console.error('Errorin API call:', error.message);
        if (error.response && error.response.status === 404) {
            return res.sendFile(__dirname + "/public/forbidden.html");
        } else {
            return res.sendFile(__dirname + "/public/error.html");
        }
    }
};


app.get('/protected', checkIfFollowing, (req,res) => {
    res.sendFile(__dirname + '/public/protected.html');
})

app.get('/', (req,res)=>{
    console.log(req)
    res.sendFile(__dirname + '/public/index.html');
})

app.get('/auth/github', passport.authenticate('github'));
app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/' }), (req,res)=>{
    res.redirect('/protected');
})

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.log(err)
            return res.sendFile(__dirname + "/public/error.html");
        }
    });
    res.redirect('/');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    });
module.exports = app;