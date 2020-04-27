export default (sequelize, DataTypes) => {
  const UserMeta = sequelize.define('UserMeta', {
    id: {
      type: DataTypes.BIGINT(20).UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      field: 'umeta_id'
    },
    userId: {
      type: DataTypes.BIGINT(20).UNSIGNED,
      field: 'user_id'
    },
    meta_key: {
      type: DataTypes.STRING,
      field: 'meta_key'
    },
    meta_value: {
      type: DataTypes.TEXT('long'),
      field: 'meta_value'
    }
  }, {
    timestamps: false,
    modelName: 'UserMeta',
    tableName: 'rsntr_usermeta'
  })

  UserMeta.associate = function (models) {
    UserMeta.belongsTo(models.User, { as: 'UserMeta', targetKey: 'id', foreignKey: 'userId' })
  }

  return UserMeta
}
