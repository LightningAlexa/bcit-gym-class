'use strict';
var Alexa = require("alexa-sdk");
var AWS = require("aws-sdk");
var DynamoAccess = require("./dynamoAccess.js");
var dbAccess;

exports.handler = function(event, context) {
    var alexa = Alexa.handler(event, context);
    dbAccess = new DynamoAccess();
    console.log(event);
    console.log(JSON.stringify(event.request.intent));
    alexa.registerHandlers(newSessionHandlers, listClassesHandler, classDescriptionHandler,
        authStudentNumberHandler, authCodeHandler);
    alexa.execute();
};

const states = {
    LIST_CLASSES: "LIST_CLASSES",
    READ_CLASS_DESCRIPTION: "READ_CLASS_DESCRIPTION",
    AUTH_GET_STUDENT_NUMBER: "AUTH_GET_STUDENT_NUMBER",
    AUTH_VERIFY_CODE: "AUTH_VERIFY_CODE"
};

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const authStudentNumberHandler = Alexa.CreateStateHandler(states.AUTH_GET_STUDENT_NUMBER, {
    'AMAZON.YesIntent': function() {
        this.response.speak('Please provide the last 6 digits of your student number')
            .listen('Please provide the last 6 digits of your student number');
        this.emit(':responseReady');
    },

    'GiveStudentNumberIntent' : function() {
        var stdId = this.event.request.intent.slots.studentNumber.value
        var stdNo = "A00" + stdId;
        console.log('stdno: ' + stdNo);
        this.attributes['studentNumber'] = stdNo;
        dbAccess.getStudent(stdNo, (err, data) => {
            if (err) {
                this.response.speak('I couldn\'t find that student number.  Could you give that to me again?')
                    .listen('Please provide your student number to continue');
                this.emit(':responseReady');
            } else {
                sendEmail(data.Item.user_email.S, stdId, (err, data) => {
                    if (err) {
                        this.response.speak(
                            'Something went wrong while sending the email.  Please try again later.');
                        this.emit(':responseReady');
                    } else {
                        this.handler.state = states.AUTH_VERIFY_CODE;
                        this.response.speak(
                            'I\'ve emailed you a verification code.  Please provide the code to complete'
                            + 'your booking.')
                            .listen('Please provide your verification code to complete your booking');
                        this.emit(':responseReady');
                    }
                });
            }
        });
    },

    'AMAZON.NoIntent': function() {
        this.handler.state = states.LIST_CLASSES;
        this.emitWithState('ListClassesForDayIntent', 'today');
    },
    'AMAZON.StopIntent': function() {
        this.response.speak('Thank you for using the booking system');
        this.emit(':responseReady');
    }
});

const authCodeHandler = Alexa.CreateStateHandler(states.AUTH_VERIFY_CODE, {
    'VerifyCodeIntent': function() {
        var code = this.event.request.intent.slots.verificationCode.value
        var stdId = this.attributes['studentNumber'];
        var student = dbAccess.getStudent(stdId, (err, data) => {
            if (err) {
                this.response.speak('Something went wrong');
                this.emit(':tell');
            } else {
                var stdCode = data.Item.code.value;
                if (code == stdCode) {
                    this.response.speak('The code successfully validated');
                    this.emit(':tell');
                } else {
                    this.response.speak('The code did not validate. Your ' + code + ' does not equal ' + stdCode);
                }
            }
        });
    },

    'AMAZON.YesIntent': function() {
        this.response.speak('auth code verification here');
        this.emit(':responseReady');
    },

    'AMAZON.NoIntent': function() {
        this.response.speak('Thank you for using the booking system');
        this.emit(':responseReady');
    },

    'AMAZON.StopIntent': function() {
        this.response.speak('Thank you for using the booking system');
        this.emit(':responseReady');
    }
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
        const day = getDayOfWeek(defaultDay, this.event);
        this.handler.state = states.READ_CLASS_DESCRIPTION;
        dbAccess.listClassesForDay((err, data) => {
            this.response.speak('On ' + day + ' we offer: ' + getClassesForDay(data, day))
            .listen('would you like to hear more about one of these classes?');
            this.emit(':responseReady');
        });
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
        console.log(JSON.stringify(this.event.request.intent.slots));
        var className = this.event.request.intent.slots.className.value;
        console.log('received description request for ' + className);
        dbAccess.getClassDescription(className, (err, data) => {
            if (err) {
                this.response.speak('something went wrong');
                this.emit(':tell');
            } else {
                this.response.speak(data.Items[0].class_description.S + ' Would you like to register?')
                    .listen('would you like to sign up for this class?');
                this.handler.state = states.AUTH_GET_STUDENT_NUMBER;
                this.emit(':responseReady');
            }
        });
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

function getDayOfWeek(defaultDay, event) {
    if (defaultDay) {
        return days[(new Date()).getDay()];
    } else {
        return days[(new Date(event.request.intent.slots.day.value)).getDay()];
    }
}

function getClassesForDay(data, day) {
    const classes = data.Items;
    var classesOnDay = [];
    for (var i = 0; i < classes.length; i++) {
        var schedule = classes[i].class_schedule.L;
        if (classIsOnDay(schedule, day)) {
            classesOnDay.push(classes[i].class_name.S);
        };
    }
    return [classesOnDay.slice(0, -1).join(', '), classesOnDay.slice(-1)[0]].join(classesOnDay.length < 2 ? '' : ' and ');
}

function classIsOnDay(schedule, day) {
    for (var j = 0; j < schedule.length; j++) {
        if (day === schedule[j].M.day.S) {
            return true;
        }
    }
    return false;
}

function sendEmail(recipient, stdId, callback) {
    var ses = new AWS.SES();
    const verification_code = generateCode();
    const charset = 'UTF-8';
    const sender = process.env.SENDER_EMAIL;
    const subject = 'Verification code';
    const body_text = 'Your verification code for Alexa is' + verification_code;
    const body_html = '<html><head></head><body>'
    + '<h3>Verification code for Alexa Login</h3>'
    + '<p>Your verification code is '
    + verification_code
    + '</p></body></html>';

    var params = {
        Source: sender,
        Destination: {
            ToAddresses: [
                recipient
            ],
        },
        Message: {
            Subject: {
                Data: subject,
                Charset: charset
            },
            Body: {
                Text: {
                    Data: body_text,
                    Charset: charset
                },
                Html: {
                    Data: body_html,
                    Charset: charset
                }
            }
        }
    };
    dbAccess.saveCodeToDB(stdId, verification_code, (err, data) => {
        ses.sendEmail(params, (err, data) => {
            if(err) {
                console.log(err.message);
                callback(err);
            } else {
                console.log("Email sent! Message ID: ", data.MessageId);
                callback(null, data);
            }
        });
    });
}

function generateCode() {
    return parseInt(Math.random() * 10000);
}
