'use strict';
var Alexa = require("alexa-sdk");

exports.handler = function(event, context) {
    var alexa = Alexa.handler(event, context);
    console.log(event);
    alexa.registerHandlers(newSessionHandlers, listClassesHandler, classDescriptionHandler, authStudentNumberHandler);
    alexa.execute();
};

const states = {
    LIST_CLASSES: "LIST_CLASSES",
    READ_CLASS_DESCRIPTION: "READ_CLASS_DESCRIPTION",
    AUTH_GET_STUDENT_NUMBER: "AUTH_GET_STUDENT_NUMBER",
    AUTH_VERIFY_CODE: "AUTH_VERIFY_CODE"
};

const authStudentNumberHandler = Alexa.CreateStateHandler(states.AUTH_GET_STUDENT_NUMBER, {
    'AMAZON.YesIntent': function() {
        this.response.speak('auth starts here');
        this.emit(':responseReady');
    },

    'AMAZON.NoIntent': function() {
        this.handler.state = states.LIST_CLASSES;
        this.emitWithState('ListClassesForDayIntent', 'today');
    },
});

const listClassesHandler = Alexa.CreateStateHandler(states.LIST_CLASSES, {
    'NewSession': function() {
        console.log('list classes new session');
        this.emit('NewSession');
    },

    'SessionEndedRequest' : function() {
        console.log('Session ended with reason: ' + this.event.request.reason);
        this.response.speak('ok, bye');
        this.emit(':responseReady');
    },

    'ListClassesForDayIntent': function(defaultDay) {
        console.log('listclassesfordayintent');
        var day = defaultDay || this.event.request.intent.slots.day.value;
        this.handler.state = states.READ_CLASS_DESCRIPTION;
        this.response.speak('List classes for ' + day + ' intent')
            .listen('would you like to hear more about one of these classes?');
        this.emit(':responseReady');
    },

    'RegisterForClassIntent': function() {
        this.handler.state = states.AUTH_GET_STUDENT_NUMBER;
        this.emitWithState('RegisterForClassIntent');
    },

    'AMAZON.YesIntent': function() {
        this.emitWithState("ListClassesForDayIntent", 'today');
    },

    'AMAZON.NoIntent': function() {
        this.response.speak('Thank you for using the booking system');
        this.emit(':responseReady');
    },

    'AMAZON.StopIntent': function() {
        this.response.speak('Thank you for using the booking system');
        this.emit(':responseReady');
    },
});

const classDescriptionHandler = Alexa.CreateStateHandler(states.READ_CLASS_DESCRIPTION, {
    'ReadClassDescriptionIntent': function() {
        var className = this.event.request.intent.slots.className.value;
        this.response.speak('you asked for ' + className + ', would you like to register?')
            .listen('would you like to sign up for this class?');
        this.handler.state = 'AUTH_GET_STUDENT_NUMBER';
        this.emit(':responseReady');
    },

    'ListClassesForDayIntent': function() {
        this.handler.state = states.LIST_CLASSES;
        this.emitWithState('ListClassesForDayIntent');
    },

    'AMAZON.YesIntent': function() {
        this.response.speak("Which class would you like to hear more about?")
            .listen('Which one would you like to hear more about?');
        this.emit(':responseReady');
    },

    'AMAZON.NoIntent': function() {
        this.handler.state = states.LIST_CLASSES;
        this.emitWithState('ListClassesForDayIntent', today);
    },

    'AMAZON.StopIntent': function() {
        this.response.speak('Thank you for using the booking system');
        this.emit(':responseReady');
    },
});

var newSessionHandlers = {
    'NewSession': function () {
        console.log('newSessionHandlers new session');
        this.handler.state = states.LIST_CLASSES;
        this.response.speak("Welcome to b.c.i.t gym class bookings. Would you like to hear about today's gym classes?")
            .listen("Would you like to hear about today's gym classes?");
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

    'AMAZON.NoIntent': function() {
        this.response.speak('Thank you for using the booking system');
        this.emit(':responseReady');
    },

    'AMAZON.StopIntent': function() {
        this.response.speak('Thank you for using the booking system');
        this.emit(':responseReady');
    },

    'Unhandled' : function() {
        this.response.speak("Sorry, I didn't get that");
    },
};
