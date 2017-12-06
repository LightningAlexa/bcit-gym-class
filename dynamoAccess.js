var AWS = require("aws-sdk");
var dynamo = new AWS.DynamoDB();

function DynamoAccess() {};

DynamoAccess.prototype.getStudent = function(stdId, callback) {
    var params = {
        TableName: process.env.USERS_TABLE,
        Key: {
            user_id: {
                S: stdId
            }
        }
    };
    dynamo.getItem(params, (err, data) => {
        if(err) {
            console.log(err.message);
            callback(err);
        } else {
            console.log(data);
            callback(null, data);
        }
    });
}

DynamoAccess.prototype.saveCodeToDB = function(stdId, code, callback) {
    var params = {
        ExpressionAttributeNames: {
            "#C": "user_code"
        },
        ExpressionAttributeValues: {
            ":c": {
                N: code.toString()
            }
        },
        Key: {
            "user_id": {
                S: stdId
            }
        },
        ReturnValues: "ALL_NEW",
        TableName: process.env.USERS_TABLE,
        UpdateExpression: "SET #C = :c"
    };
    dynamo.updateItem(params, function(err, data) {
        if(err) {
            console.log(err.message);
            return callback(err);
        } else {
            console.log("Code entered in DB");
            return callback(null, data);
        }
    });
}

DynamoAccess.prototype.listClassesForDay = function(callback) {
    var params = {
        TableName: process.env.CLASSES_TABLE
    };
    dynamo.scan(params, (err, data) => {
        if (err) return callback(err);
        return callback(null, data);
    });
}

DynamoAccess.prototype.getClassDescription = function(className, callback) {
    var params = {
        ExpressionAttributeValues: {
            ":n": {
                S: className
            }
        },
        FilterExpression: "class_name = :n",
        TableName: process.env.CLASSES_TABLE
    };
    dynamo.scan(params, (err, data) => {
        if (err) return callback(err);
        return callback(null, data);
    });
}

DynamoAccess.prototype.createBooking = function(studentId, classId, day, callback) {
    var params = {
        Item: {
            "user_id": { S: studentId },
            "class_id": { S: classId + '-' + day }
        },
        ReturnConsumedCapacity: "TOTAL",
        TableName: process.env.BOOKINGS_TABLE
    };
    dynamo.putItem(params, function(err, data) {
        if (err) {
            console.log(err);
            return callback(err);
        } else {
            return callback(null, data);
        }
    });
}

module.exports = DynamoAccess;
