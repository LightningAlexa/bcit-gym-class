var AWS = require("aws-sdk");
var dynamo = new AWS.DynamoDB();

function DynamoAccess() {};

DynamoAccess.prototype.getStudentEmail = function(stdId, callback) {
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
        } else {
            callback(data.Item.email.S, stdId);
            console.log(data);
        }
    });
}

DynamoAccess.prototype.saveCodeToDB = function(stdId, code) {
    var params = {
        ExpressionAttributeNames: {
            "#C": "code"
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
        if(err)
            console.log(err.message);
        else
            console.log("Code entered in DB");
    });
}

DynamoAccess.prototype.listClassesForDay = function(day, callback) {
    var params = {
        TableName: process.env.CLASSES_TABLE
    };
    dynamo.scan(params).promise().then(callback);
}

module.exports = DynamoAccess;
