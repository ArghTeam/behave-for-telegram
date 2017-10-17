"use strict";

const path = require('path');
const co = require('co');
const needle = require('needle');
const GoogleAuth = require('google-auth-library');
const authFactory = new GoogleAuth();

const GOOGLE_AUTH_SCOPES = ['https://www.googleapis.com/auth/userinfo.email'];


let googleToken = null; // cache google token here
let googleAuthClient = null; // cache authClient


// For development purpose to prevent getting new token on each script run
// googleToken = { access_token: 'ya29.ElnSA4G7N-Pe-D9BrYEpiJ5kH_m5g1sQlNcYPiwllvK6u7OSiCk6AyrVfcg4b3H5otDq8KxTtH4yoVk3r6AO5jqnvBCsX8gM6FKUUGFB66vhaGXDJ0y_42id-w',
//   token_type: 'Bearer',
//   expiry_date: 1484339014000,
//   refresh_token: 'jwt-placeholder' }

// Set path to Service Account JSON if not yet in env
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS)
  process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, '../config/production_service_acc.json');


const makeRequest = (method, url, data) =>
  new Promise((resolve, reject) =>{
    let options = {
      json: true,
      parse: true,
      headers: {
        Authorization: `Bearer ${googleToken.access_token}`
      }
    };

    needle.request(method, url, data, options, (err, resp) =>{
      if (err) return reject(err);
      resolve(resp.body);
    })
  });


const getAuthClient = () =>
  new Promise((resolve, reject) =>{
    authFactory.getApplicationDefault((err, authClient) =>{
      if (err) return reject(err);

      if (authClient.createScopedRequired && authClient.createScopedRequired()) {
        authClient = authClient.createScoped(GOOGLE_AUTH_SCOPES);
      }

      resolve(authClient);
    });
  });


const getGoogleToken = () =>
  new Promise((resolve, reject) =>{
    // If we already got token from google and it's not yet expired - return it
    if (googleToken) {
      let now = +new Date();
      if (googleToken.expiry_date > now) return resolve(googleToken);
    }

    // Get new token from google
    googleAuthClient.authorize((err, token) =>{
      if (err) return reject(err);
      googleToken = token;
      resolve(googleToken);
    });
  });


exports.makeSignedRequest = (method, url, data) =>
  co(function *(){
    if (!googleAuthClient) googleAuthClient = yield getAuthClient();
    yield getGoogleToken();
    return makeRequest(method, url, data);
  });
