"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _default = (sequelize, DataTypes) => {
  const Tag = sequelize.define('Tag', {
    id: {
      primaryKey: true,
      autoIncrement: true,
      type: DataTypes.INTEGER,
      field: 'tagid'
    },
    trackId: {
      type: DataTypes.INTEGER,
      field: 'tid'
    },
    tagnames: {
      type: DataTypes.STRING,
      field: 'tagnames'
    }
  }, {
    timestamps: false,
    modelName: 'Tag',
    tableName: 'tags'
  });

  Tag.associate = function (models) {
    Tag.belongsTo(models.Track, {
      as: 'Tag',
      foreignKey: 'id'
    });
  };

  return Tag;
};

exports.default = _default;
module.exports = exports.default;