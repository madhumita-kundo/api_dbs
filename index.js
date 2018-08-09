const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const db = require('./helper/datasim.js');
const data = db.data;

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const firebase = require('firebase-admin');

//var firebase = require('firebase');
//var app = firebase.initializeApp({ ... });

//import firebase from 'firebase/app';
//import 'firebase/firestore';
//import 'firebase/message';

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Gmail API.
  authorize(JSON.parse(content), listLabels);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listLabels(auth) {
  const gmail = google.gmail({version: 'v1', auth});
  gmail.users.labels.list({
    userId: 'me',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const labels = res.data.labels;
    if (labels.length) {
      console.log('Labels:');
      labels.forEach((label) => {
        console.log(`- ${label.name}`);
      });
    } else {
      console.log('No labels found.');
    }
  });
}

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

app.get('/users', function (req, res) {
    res.json(data);
})
app.post('/users', function (req, res) {
    req.body.id = Math.floor(Date.now());
    data.users.push(req.body);
    res.send('POST sent')
})
app.get('/users/:id', function (req, res) {
    res.send(db.getRow(req.params.id));
})
app.put('/users/:id', function (req, res) {
    let id = db.findID(data.users,req.params.id);
    if (id != -1) {
        data.users[id] = req.body
        res.write('updated ' + id)
    }
    else {
        res.write('not found');
    }
    res.send();
})
app.delete('/users/:id', function (req, res) {
    let id = db.findID(data.users,req.params.id);
    if (id != -1) {
        data.users.splice(id, 1);
        res.write('deleted ' + req.params.id)
    }
    else {
        res.write('not found');
    }
    res.send()
})
app.listen(3000);