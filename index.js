'use strict';
var Alexa = require("alexa-sdk");


const roll = (sides) => {
    return Math.random() * (sides - 1) + 1;
};

// For detailed tutorial on how to making a Alexa skill,
// please visit us at http://alexa.design/build

exports.handler = function(event, context) {
    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        this.emit('SayHello');
    },
    'RollDiceIntent': function () {
        const sides = this.event.request.intent.slots.sides.value;
        let numDice = this.event.request.intent.slots.numDice.value;

        let rolledNum = 0;
        while (numDice--)
            rolledNum += roll(sides);
        
        this.response.speak('You rolled a ' + 6);
        this.emit(':responseReady');
    },
    'SessionEndedRequest' : function() {
        console.log('Session ended with reason: ' + this.event.request.reason);
    },
    'AMAZON.StopIntent' : function() {
        this.response.speak('Bye');
        this.emit(':responseReady');
    },
    'AMAZON.HelpIntent' : function() {
        this.response.speak("You can try: 'alexa, ask dice roller to roll a d 6' or 'alexa, ask dice roller to roll a d 20'");
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent' : function() {
        this.response.speak('Bye');
        this.emit(':responseReady');
    },
    'Unhandled' : function() {
        this.response.speak("Sorry, I didn't get that");
    }
};
