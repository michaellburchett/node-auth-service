const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
});

module.exports.setupMysql = function(AppModel) {
    var modelname = (AppModel.constructor.name);
    var timestampOverrides = AppModel.dataOverrides().timestamps;
    var values = mapDataTypes(AppModel.values());

    var values = addRelationshipsToValues(AppModel.relationships(), values);

    class Entity extends Model {}

    Entity.init(values, {
        timestamps: true,
        ...timestampOverrides,
        sequelize, 
        modelName: getModelName(AppModel, modelname)
    });

    return Entity;
}

function getModelName(AppModel, modelname) {
    if(AppModel.dataOverrides().databaseName) {
        return AppModel.dataOverrides().databaseName
    } else {
        return camelCaseToUnderline(modelname)
    }
}

function camelCaseToUnderline(string) {
    return string.replace(/(?:^|\.?)([A-Z])/g, function (x,y){return "_" + y.toLowerCase()}).replace(/^_/, "");
}

function mapDataTypes(values) {
    Object.keys(values).forEach(function(key) {
        values[key] = mapSingleDataType(values[key]);
    });

    return values;
}

function addRelationshipsToValues(relationships, values) {
    if(relationships.belongsTo) {
        Object.keys(relationships.belongsTo).forEach(function(belongsTokey) {
            Object.keys(values).forEach(function(valueskey) {
                if(belongsTokey == valueskey) {
                    values[valueskey] = mapRelationships(
                        mapSingleDataType(values[valueskey]), 
                        relationships.belongsTo[belongsTokey]
                    );
                }
            });
        });
    }

    return values;

}

function mapSingleDataType(value) {
    var vals = dataTypeValues();

    if(vals[value]) {
        return vals[value];
    } else {
        return value;
    }
}

function dataTypeValues() {
    return {
        "STRING": DataTypes.STRING,
        "DATE": DataTypes.DATE,
        "BOOLEAN": DataTypes.BOOLEAN,
        "INTEGER": DataTypes.INTEGER
    }
}

function mapRelationships(type, model) {
    return {
        type: type,
        references: {
            model: model,
            key: "id"
        }
    }
}