const config = require("../config.json");
const database = require("../db/index.js");

class AppModel {
    
    constructor() {
        switch (config.database) {
            case "mysql":
                this.data = database.setupMysql(this);
                break;
        }
    }

    async parentFetch(id) {
        return this.transform(await this.data.findOne({where: {id: id}}));;
    }

    async parentFetchByField(field, value) {
        return this.transform(await this.data.findOne({where: {[field]: value}}));
    }

    async parentCreate(values) {
        return this.transform(await this.data.create(values));
    }

    async parentUpdate(id, field, value) {
        const entity = await this.data.findOne({where: {id: id}});
        entity[field] = value;
        await entity.save();
        return this.transform(entity);
    }

    async parentUpdateByField(searchField, searchValue, updateField, updateValue) {
        const entity = await this.data.findOne({where: {[searchField]: searchValue}});
        entity[updateField] = updateValue;
        await entity.save();
        return this.transform(entity);
    }

    async parentDelete(id) {
        var entity = await this.data.findOne({where: {id: id}});
        await entity.destroy();
        return true;
    }

    async parentDeleteByField(field, value) {
        var entity = await this.data.findOne({where: {[field]: value}});
        await entity.destroy();
        return true;
    }

    transform(data) {
        switch (config.database) {
            case "mysql":
                return (data ? data.dataValues : null);
        }
    }
}

module.exports = AppModel;