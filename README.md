# alexa gym booking skill

for school.

### To load the gym-classes table with data, enter the following command from project root:

aws dynamodb batch-write-item --request-items file://./dynamodb/gym-classes.json

### To load the gym-users table with data, enter the following command from project root:

aws dynamodb batch-write-item --request-items file://./dynamodb/gym-users.json