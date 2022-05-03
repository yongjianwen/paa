const mssql = require('mssql')

const rdsUser = process.env.RDS_USER;
const rdsPassword = process.env.RDS_PASSWORD;
const rdsServer = process.env.RDS_SERVER;
const rdsDatabase = process.env.RDS_DATABASE;

exports.reviewApplicationHandler = (event, context, callback) => {
  const config = {
    user: rdsUser,
    password: rdsPassword,
    server: rdsServer,
    database: rdsDatabase
  };

  console.log(event);
  const userId = event.headers['userid'];
  const applicationId = event['pathParameters']['applicationId'];
  const rating = event.body['rating'];

  mssql.connect(config, (err) => {
    if (err) {
      console.log(err);
      callback(err);
    } else {
      const req = new mssql.Request();
      req.query('UPDATE [AdoptionApplication] SET UserRating = ' + rating + ' WHERE Id = ' + applicationId)
        .then((result) => {
          mssql.close();
          let response = {
            statusCode: 200,
            headers: {
              "Access-Control-Allow-Origin" : "*",
              "Access-Control-Allow-Credentials" : true
            },
            isBase64Encoded: false,
            body: JSON.stringify(true)
          };
          callback(null, response);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  });

  return null;
};
