const Captain = require('./Captain.js');
const Plane = require('./Plane.js');
const Passenger = require('./Passenger.js');
const Airport = require('./Airport.js');

class Flights extends Model {

    /**
     * The table associated with the model.
     *
     * @var string
     */
    table() { return 'my_flights' };

    /**
     * The primary key associated with the table.
     *
     * @var string
     */
    primaryKey() { return 'flight_id' };

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    timestamps() { return false; }

    CREATED_AT() { return 'creation_date' };
    UPDATED_AT() { return 'last_update' };

    /**
     * The connection name for the model.
     *
     * @var string
     */
    connection() { return 'connection-name' }

    /**
     * The model's default values for attributes.
     *
     * @var json
     */
    attributes() {
        return {
            'delayed': false
        }
    };

     /**
     * Get the captain record associated with the flight.
     */
    captain()
    {
        return this.hasOne(Captain, 'cap_id');
    }

     /**
     * Get the plane record associated with the flight.
     */
    plane()
    {
        return this.belongsTo(Plane, 'airplane_id');
    }

     /**
     * Get the passenger record associated with the flight.
     */
    passenger()
    {
        return this.hasMany(Passenger, 'pass_id');
    }

     /**
     * Get the airport record associated with the flight.
     */
    airports()
    {
        return this.belongsToMany(Airport, 'port_id');
    }
}

modules.exports = Flights;