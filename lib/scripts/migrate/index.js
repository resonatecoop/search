"use strict";

var _models = require("./db/models");

var _winston = _interopRequireDefault(require("winston"));

var _bluebird = _interopRequireDefault(require("bluebird"));

var _mongoose = _interopRequireDefault(require("mongoose"));

var _yargs = _interopRequireDefault(require("yargs"));

var _decodeUriComponent = _interopRequireDefault(require("decode-uri-component"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/resonate';

_mongoose.default.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = _mongoose.default.connection;
db.on('error', err => console.error(err)); // TODO add Release

const Track = require('../../models/track');

const Profile = require('../../models/profile');

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

const syncProfiles = async () => {
  logger.info('starting sync');
  const result = await query(`
    SELECT user.ID AS id,
    MAX(CASE WHEN um.meta_key = 'nickname' THEN um.meta_value ELSE NULL END) AS name,
    umrole.meta_value as role
    FROM rsntr_users AS user
    JOIN rsntr_usermeta AS um ON(um.user_id = user.ID)
    INNER JOIN rsntr_usermeta AS umrole ON(umrole.user_id = user.ID AND umrole.meta_key = 'role' AND umrole.meta_value IN('member', 'bands', 'label-owner'))
    GROUP BY um.user_id, role
    ORDER BY id
  `);

  const promises = _bluebird.default.map(result, item => {
    const kind = {
      member: 'artist',
      'label-owner': 'label',
      bands: 'band'
    }[item.role];
    return Profile.findOneAndUpdate({
      user_id: item.id,
      kind: kind
    }, {
      user_id: item.id,
      kind: kind,
      name: item.name
    }, {
      new: true,
      upsert: true,
      useFindAndModify: false
    });
  }, {
    concurrency: 100
  });

  return _bluebird.default.all(promises);
};

const syncTracks = async () => {
  logger.info('starting sync');
  const result = await query(`
    SELECT track.track_name as title, track.tid as id, um.meta_value as display_artist, umRole.meta_value as role, tag.tagnames as tags
    FROM tracks as track
    INNER JOIN rsntr_usermeta as um ON(um.user_id = track.uid AND meta_key = 'nickname')
    INNER JOIN rsntr_usermeta as umRole ON(umRole.user_id = track.uid AND umRole.meta_key = 'role' AND umRole.meta_value IN('member', 'bands', 'label-owner'))
    INNER JOIN tags as tag ON(tag.tid = track.tid)
    WHERE track.status IN(0, 2, 3)
    AND track.track_album != ''
    AND track.track_cover_art != ''
  `);

  const promises = _bluebird.default.map(result, async item => {
    return Track.findOneAndUpdate({
      track_id: item.id
    }, {
      track_id: item.id,
      title: (0, _decodeUriComponent.default)(item.title),
      display_artist: (0, _decodeUriComponent.default)(item.display_artist),
      tags: (0, _decodeUriComponent.default)(item.tags).split(',').map(item => item.trim()).map(tag => (0, _decodeUriComponent.default)(tag).split(',').map(tag => tag.trim())).flat(1)
    }, {
      new: true,
      upsert: true,
      useFindAndModify: false
    });
  }, {
    concurrency: 100
  });

  return _bluebird.default.all(promises);
};

_yargs.default // eslint-disable-line
.command('run [id]', 'run sync', yargs => {
  yargs.positional('id', {
    type: 'number',
    describe: 'artist id'
  });
}, argv => {
  return _bluebird.default.all([syncProfiles()]).then(() => {
    logger.info('synced artists and bands');
    return syncTracks();
  }).then(() => {
    logger.info('synced tracks');
  });
}).help().argv;