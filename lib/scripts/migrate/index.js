#!/usr/bin/env node
"use strict";

var _models = require("./db/models");

var _winston = _interopRequireDefault(require("winston"));

var _bluebird = _interopRequireDefault(require("bluebird"));

var _decodeUriComponent = _interopRequireDefault(require("decode-uri-component"));

var _track = _interopRequireDefault(require("../../models/track"));

var _release = _interopRequireDefault(require("../../models/release"));

var _profile = _interopRequireDefault(require("../../models/profile"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const query = (query, values) => {
  return _models.Resonate.query(query, {
    type: _models.Resonate.QueryTypes.SELECT,
    replacements: values
  });
};

const logger = _winston.default.createLogger({
  level: 'info',
  format: _winston.default.format.json(),
  defaultMeta: {
    service: 'search'
  },
  transports: [new _winston.default.transports.Console({
    level: 'debug',
    format: _winston.default.format.json()
  }), new _winston.default.transports.File({
    filename: 'error.log',
    level: 'error'
  })]
});

const syncReleases = async () => {
  logger.info('starting syncing releases');
  const result = await query(`
    SELECT trackGroup.id, trackGroup.title, trackGroup.release_date, trackGroup.display_artist, trackGroup.creator_id, trackGroup.composers, trackGroup.composers, trackGroup.tags, trackGroup.about
    FROM track_groups as trackGroup
    INNER JOIN rsntr_usermeta AS um ON(um.user_id = trackGroup.creator_id AND um.meta_key = 'role' AND um.meta_value IN('member', 'bands', 'label-owner'))
    WHERE trackGroup.private = false
  `);
  return _bluebird.default.map(result, item => {
    const data = {
      track_group_id: item.id,
      title: item.title,
      creator_id: item.creator_id,
      display_artist: item.display_artist,
      about: item.about
    };

    if (item.release_date) {
      data.release_date = new Date(item.release_date);
    }

    if (item.composers) {
      data.composers = item.composers.split(',');
    }

    if (item.performers) {
      data.performers = item.performers.split(',');
    }

    if (item.tags) {
      data.tags = item.tags.split(',');
    }

    return _release.default.findOneAndUpdate({
      track_group_id: item.id
    }, data, {
      new: true,
      upsert: true,
      useFindAndModify: false
    });
  }, {
    concurrency: 100
  });
};

const syncProfiles = async () => {
  logger.info('starting syncing profiles');
  const result = await query(`
    SELECT user.ID AS id,
    umnickname.meta_value as name,
    MAX(CASE WHEN um.meta_key = 'ArtistCity' THEN um.meta_value ELSE NULL END) AS artistCity,
    MAX(CASE WHEN um.meta_key = 'description' THEN um.meta_value ELSE NULL END) AS bio,
    MAX(CASE WHEN um.meta_key = 'city' THEN um.meta_value ELSE NULL END) AS city,
    MAX(CASE WHEN um.meta_key = 'country' THEN um.meta_value ELSE NULL END) AS country,
    umrole.meta_value as role
    FROM rsntr_users AS user
    JOIN rsntr_usermeta AS um ON(um.user_id = user.ID)
    INNER JOIN rsntr_usermeta AS umnickname ON(umnickname.user_id = user.ID AND umnickname.meta_key = 'nickname')
    INNER JOIN rsntr_usermeta AS umrole ON(umrole.user_id = user.ID AND umrole.meta_key = 'role' AND umrole.meta_value IN('member', 'bands', 'label-owner'))
    GROUP BY um.user_id, role, name
    ORDER BY id
  `);
  return _bluebird.default.map(result, item => {
    const kind = {
      member: 'artist',
      'label-owner': 'label',
      bands: 'band'
    }[item.role];
    const data = {
      user_id: item.id,
      city: item.artistCity || item.city,
      country: item.country,
      kind: kind,
      name: (0, _decodeUriComponent.default)(item.name)
    };

    if (item.bio) {
      data.bio = (0, _decodeUriComponent.default)(item.bio);
    }

    return _profile.default.findOneAndUpdate({
      user_id: item.id,
      kind: kind
    }, data, {
      new: true,
      upsert: true,
      useFindAndModify: false
    });
  }, {
    concurrency: 100
  });
};

const syncTracks = async () => {
  logger.info('starting syncing tracks');
  const result = await query(`
    SELECT track.tid as id, track.track_name as title, track.uid as creator_id, track.track_composer as composer, um.meta_value as display_artist, tag.tagnames as tags
    FROM tracks as track
    INNER JOIN rsntr_usermeta as um ON(um.user_id = track.uid AND meta_key = 'nickname')
    INNER JOIN rsntr_usermeta as umRole ON(umRole.user_id = track.uid AND umRole.meta_key = 'role' AND umRole.meta_value IN('member', 'bands', 'label-owner'))
    LEFT JOIN tags as tag ON(tag.tid = track.tid)
    WHERE track.status IN(0, 2, 3)
    AND track.track_album != ''
    AND track.track_cover_art != ''
  `);
  return _bluebird.default.map(result, async item => {
    const data = {
      track_id: item.id,
      creator_id: item.creator_id,
      title: (0, _decodeUriComponent.default)(item.title),
      display_artist: (0, _decodeUriComponent.default)(item.display_artist)
    };

    if (item.composer) {
      data.composer = (0, _decodeUriComponent.default)(item.composer);
    }

    if (item.tags) {
      data.tags = (0, _decodeUriComponent.default)(item.tags).split(',').map(item => item.trim()).map(tag => (0, _decodeUriComponent.default)(tag).split(',').map(tag => tag.trim())).flat(1);
    }

    return _track.default.findOneAndUpdate({
      track_id: item.id
    }, data, {
      new: true,
      upsert: true,
      useFindAndModify: false
    });
  }, {
    concurrency: 100
  });
};

syncProfiles().then(() => {
  logger.info('synced artists and bands');
  return syncTracks();
}).then(() => {
  logger.info('synced tracks');
  return syncReleases();
}).then(() => {
  logger.info('synced releases');
});