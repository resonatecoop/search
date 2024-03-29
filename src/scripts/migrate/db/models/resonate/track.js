const statusValues = ['free+paid', 'hidden', 'free', 'paid', 'deleted']

export default (sequelize, DataTypes) => {
  const Track = sequelize.define('Track', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'tid'
    },
    creator_id: {
      type: DataTypes.INTEGER,
      field: 'uid'
    },
    title: {
      type: DataTypes.STRING,
      field: 'track_name'
    },
    artist: {
      type: DataTypes.STRING,
      field: 'track_artist'
    },
    album: {
      type: DataTypes.STRING,
      field: 'track_album'
    },
    album_artist: {
      type: DataTypes.STRING,
      field: 'track_album_artist'
    },
    composer: {
      type: DataTypes.STRING,
      field: 'track_composer'
    },
    year: {
      type: DataTypes.INTEGER,
      field: 'track_year'
    },
    url: {
      type: DataTypes.UUID,
      field: 'track_url'
    },
    cover_art: {
      type: DataTypes.UUID,
      field: 'track_cover_art'
    },
    number: {
      type: DataTypes.INTEGER,
      field: 'track_number'
    },
    status: {
      type: DataTypes.INTEGER,
      validate: {
        min: 0,
        max: 4
      },
      set (status) {
        this.setDataValue('status', statusValues.indexOf(status))
      },
      get () {
        const status = this.getDataValue('status')
        return statusValues[status]
      },
      defaultValue: 1, // hidden
      field: 'status'
    },
    createdAt: {
      type: DataTypes.INTEGER,
      field: 'date'
    }
  }, {
    timestamps: false,
    modelName: 'Track',
    tableName: 'tracks'
  })

  Track.associate = function (models) {
    Track.hasMany(models.Tag, { as: 'tags', foreignKey: 'trackId', sourceKey: 'id' })
    Track.hasMany(models.UserMeta, { as: 'meta', foreignKey: 'user_id', sourceKey: 'creator_id' })
  }

  return Track
}
