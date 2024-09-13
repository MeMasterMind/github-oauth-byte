const express = require('express');
const app = express();
const axios = require('axios');
const passport = require('passport');
const githubStrategy = require('passport-github2').Strategy;

passport.use(new githubStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/github/callback',
    scope: 'user:follow',
}, (accessToken, refreshToken, profile, done) => {
    console.log(accessToken, refreshToken, profile) 
    return done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user);
  });
  
passport.deserializeUser((obj, done) => {
    done(null, obj);
  });

app.use(passport.initialize());
app.use(passport.session());

const checkIfFollowing = async (req,res,next) =>{
    if (!req.isAuthenticated() || !req.uer) {
        return res.status(401).json({message: 'You are not authenticated !!'});
    }
    const accessToken = req.user;
    const url = `https://api.github.com/user/following/bytemait`;

    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `token ${accessToken}`,
                Accept: 'application/vnd.github.v3+json',
            },
    })
        if (response.status === 204) {
            next();
        }
        else {
            res.status(403).json({ message: `You must follow BYTE MAIT (@bytemait) to access this page.` });
        }
        }
    catch (error){
        if (error.response && error.response.status === 404) {
            res.status(403).json({ message: `You must follow BYTE MAIT (@bytemait) to access this page.` });
    }   else {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}

app.get('/protected', checkIfFollowing, (req,res) => {
    res.json({ message: 'You are now accessing the protected route!' });
})

app.get('/', (req,res)=>{
    res.sendFile(__dirname + '/index.html');
})

app.get('/auth/github', passport.authenticate('github'));
app.get(
    '/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/' }),
(req,res)=>{
    res.redirect('/protected');
})

app.listen(3000, () => {
    console.log('Server is running on port 3000');
    });