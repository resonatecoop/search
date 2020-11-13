#!/usr/bin/env node
"use strict";

var _track = _interopRequireDefault(require("../../models/track"));

var _profile = _interopRequireDefault(require("../../models/profile"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const syncTracks = () => {
  return new Promise((resolve, reject) => {
    const stream = _track.default.synchronize();

    let count = 0;
    stream.on('data', function (err, doc) {
      if (err) return reject(err);
      count++;
    });
    stream.on('close', function () {
      console.log('indexed ' + count + ' tracks');
      return resolve(count);
    });
    stream.on('error', function (err) {
      return reject(err);
    });
  });
};

const syncProfiles = () => {
  return new Promise((resolve, reject) => {
    const stream = _profile.default.synchronize();

    let count = 0;
    stream.on('data', function (err, doc) {
      if (err) return reject(err);
      count++;
    });
    stream.on('close', function () {
      console.log('indexed ' + count + ' profiles');
      return resolve(count);
    });
    stream.on('error', function (err) {
      return reject(err);
    });
  });
};

Promise.all([syncTracks(), syncProfiles()]).then(() => {
  console.log('done sync');
}).catch(err => {
  console.log(err);
});