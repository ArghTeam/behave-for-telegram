"use strict";

const co = require('co');
const googleApi = require('./google_api');

const ANALYZE_API_DOMAIN = process.env.ANALYZE_API_DOMAIN || 'https://commentanalyzer.googleapis.com';
const ANALYZE_API_ANALYZE_COMMENT = `${ANALYZE_API_DOMAIN}/v1alpha1/comments:analyze`;
const ANALYZE_API_SUGGEST_COMMENT = `${ANALYZE_API_DOMAIN}/v1alpha1/comments:suggestscore`;

const ATTRIBUTE_NAME = 'TOXICITY_FAST'


const analyzeComment = data =>
  googleApi.makeSignedRequest('post', ANALYZE_API_ANALYZE_COMMENT, data)

const suggestComment = data =>
  googleApi.makeSignedRequest('post', ANALYZE_API_SUGGEST_COMMENT, data)


const analyze = text =>
  co(function *(){
    let data = {
      comment: {
        text: text
      },
      requestedAttributes: {},
      doNotStore: false
    };

    data.requestedAttributes[ATTRIBUTE_NAME] = {}

    let result = yield analyzeComment(data);
    return result;
  });

const suggest = (text, score, communityId) =>
  co(function *(){
    let data = {
      comment: {
        text: text
      },
      attributeScores: {}
      // doNotStore: false
    };

    data.attributeScores[ATTRIBUTE_NAME] = {
      summaryScore: {
        value: score
      }
    }

    if (communityId) data.communityId = communityId;

    let result = yield suggestComment(data);
    return result;
  });


exports.analyze = analyze;

exports.getToxicityScore = text =>
  co(function *(){
    let result = yield analyze(text);
    if (result.attributeScores) {
      return result.attributeScores[ATTRIBUTE_NAME].summaryScore.value;
    }
    return 0;
  });

exports.suggestToxicityScore = suggest;
