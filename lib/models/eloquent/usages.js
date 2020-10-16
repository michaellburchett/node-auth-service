const Flight = require('./Flight.js');

var flight = Flight.find(1);
flight.type = "overseas";
flight.save();

var flight2 = Flight.create(
    {
        this: "Table",
        that: "Another"
    }
);
var flight3 = new Flight;
flight3.this = "Something";
flight3.that = "SomethingElse";
flight3.save();

Flight.delete(1);