#!/usr/bin/env node

import {
  Resonate as sequelize
} from './db/models'

import { db as mongooseConnection } from '../../mongoose'
import slug from 'slug'
import winston from 'winston'
import Promise from 'bluebird'
import decodeUriComponent from 'decode-uri-component'

import Track from '../../models/track'
import Release from '../../models/release'
import Profile from '../../models/profile'

const query = (query, values) => {
  return sequelize.query(query, {
    type: sequelize.QueryTypes.SELECT,
    replacements: values
  })
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'search' },
  transports: [
    new winston.transports.Console({
      level: 'debug',
      format: winston.format.json()
    }),
    new winston.transports.File({
      filename: 'error.log',
      level: 'error'
    })
  ]
})

const syncReleases = async () => {
  logger.info('starting syncing releases')

  const result = await query(`
    SELECT trackGroup.id, trackGroup.title, trackGroup.release_date, trackGroup.display_artist, trackGroup.creator_id, trackGroup.composers, trackGroup.composers, trackGroup.tags, trackGroup.about
    FROM track_groups as trackGroup
    INNER JOIN rsntr_usermeta AS um ON(um.user_id = trackGroup.creator_id AND um.meta_key = 'role' AND um.meta_value IN('member', 'bands', 'label-owner'))
    WHERE (trackGroup.release_date <= NOW() OR trackGroup.release_date IS NULL)
    AND trackGroup.private = false
    AND trackGroup.enabled = true
  `)

  return Promise.map(result, (item) => {
    const data = {
      track_group_id: item.id,
      title: item.title,
      creator_id: item.creator_id,
      display_artist: item.display_artist,
      about: item.about
    }

    if (item.release_date) {
      data.release_date = new Date(item.release_date)
    }

    if (item.composers) {
      data.composers = item.composers.split(',')
    }

    if (item.performers) {
      data.performers = item.performers.split(',')
    }

    if (item.tags) {
      data.tags = item.tags
        .split(',')
        .map(tag => tag.replace(/-|\s/g, ''))
        .filter(Boolean)
    }

    return Release.findOneAndUpdate(
      { track_group_id: item.id },
      data,
      { new: true, upsert: true, useFindAndModify: false }
    )
  }, { concurrency: 100 })
}

const syncProfiles = async () => {
  logger.info('starting syncing profiles')

  const result = await query(`
    SELECT user.ID AS id,
    umnickname.meta_value as name,
    MAX(CASE WHEN um.meta_key = 'ArtistCity' THEN um.meta_value ELSE NULL END) AS artistCity,
    MAX(CASE WHEN um.meta_key = 'description' THEN um.meta_value ELSE NULL END) AS bio,
    MAX(CASE WHEN um.meta_key = 'city' THEN um.meta_value ELSE NULL END) AS city,
    MAX(CASE WHEN um.meta_key = 'country' THEN um.meta_value ELSE NULL END) AS country,
    MAX(CASE WHEN um.meta_key = 'twitter' THEN IF(locate('/',um.meta_value) = 0, um.meta_value,RIGHT(um.meta_value, locate('/', REVERSE(um.meta_value))-1)) ELSE NULL END) AS twitter_handle,
    umrole.meta_value as role
    FROM rsntr_users AS user
    JOIN rsntr_usermeta AS um ON(um.user_id = user.ID)
    INNER JOIN rsntr_usermeta AS umnickname ON(umnickname.user_id = user.ID AND umnickname.meta_key = 'nickname')
    INNER JOIN rsntr_usermeta AS umrole ON(umrole.user_id = user.ID AND umrole.meta_key = 'role' AND umrole.meta_value IN('member', 'bands', 'label-owner'))
    GROUP BY um.user_id, role, name
    ORDER BY id
  `)

  return Promise.map(result, async (item) => {
    const kind = {
      member: 'artist',
      'label-owner': 'label',
      bands: 'band'
    }[item.role]

    const data = {
      user_id: item.id,
      city: item.artistCity || item.city,
      country: item.country,
      kind,
      twitter_handle: item.twitter_handle,
      name: decodeUriComponent(item.name)
    }

    if (data.kind !== 'label') {
      const [label] = await query(`
        SELECT um2.meta_value as name
        FROM rsntr_usermeta as um
        INNER JOIN rsntr_usermeta as um2 ON (um.meta_value = um2.user_id AND um2.meta_key = 'nickname')
        WHERE um.user_id = :creatorId
        AND um.meta_key = 'mylabel'
        LIMIT 1
      `, { creatorId: item.id })

      if (label && label.name) {
        data.label = label.name
      }

      const [track] = await query(`
        SELECT track.date as date
        FROM tracks as track
        WHERE track.uid = :creatorId
        AND track.status IN(0, 2, 3)
        AND track.date IS NOT NULL
        AND track.track_album != ''
        AND track.track_cover_art != ''
        ORDER BY track.date DESC
        LIMIT 1
      `, { creatorId: item.id })

      if (track && track.date) {
        data.last_activity = new Date(track.date * 1000) // unix timestamp to date
      } else {
        data.last_activity = null
      }
    }

    if (item.bio) {
      data.bio = decodeUriComponent(item.bio)
    }

    data.name_slug = slug(data.name)

    return Profile.findOneAndUpdate(
      { user_id: item.id, kind },
      data,
      { new: true, upsert: true, useFindAndModify: false }
    )
  }, { concurrency: 100 })
}

const syncTracks = async () => {
  logger.info('starting syncing tracks')

  const result = await query(`
    SELECT track.tid as id, track.track_name as title, track.uid as creator_id, track.track_composer as composer, um.meta_value as display_artist, tag.tagnames as tags
    FROM tracks as track
    INNER JOIN rsntr_usermeta as um ON(um.user_id = track.uid AND meta_key = 'nickname')
    INNER JOIN rsntr_usermeta as umRole ON(umRole.user_id = track.uid AND umRole.meta_key = 'role' AND umRole.meta_value IN('member', 'bands', 'label-owner'))
    LEFT JOIN tags as tag ON(tag.tid = track.tid)
    WHERE track.status IN(0, 2, 3)
    AND track.track_album != ''
    AND track.track_cover_art != ''
  `)

  return Promise.map(result, async (item) => {
    const data = {
      track_id: item.id,
      creator_id: item.creator_id,
      title: decodeUriComponent(item.title),
      display_artist: decodeUriComponent(item.display_artist)
    }

    if (item.composer) {
      data.composer = decodeUriComponent(item.composer)
    }

    if (item.tags) {
      data.tags = decodeUriComponent(decodeUriComponent(item.tags))
        .split(',')
        .map(tag => tag
          .trim()
          .toLowerCase()
          .replace(/-|\s/g, '')
        )
        .filter(Boolean)
    }
    return Track.findOneAndUpdate(
      { track_id: item.id },
      data,
      { new: true, upsert: true, useFindAndModify: false }
    )
  }, { concurrency: 100 })
}

(async () => {
  try {
    await syncProfiles()
    logger.info('Done syncing profiles')
    await syncTracks()
    logger.info('Done syncing tracks')
    await syncReleases()
    logger.info('Done syncing releases')
  } catch (err) {
    logger.error(err)
  } finally {
    mongooseConnection.close()
    process.exit(0)
  }
})()
