const mssql = require('mssql')

const rdsUser = process.env.RDS_USER;
const rdsPassword = process.env.RDS_PASSWORD;
const rdsServer = process.env.RDS_SERVER;
const rdsDatabase = process.env.RDS_DATABASE;

exports.commentListingHandler = (event, context, callback) => {
  const config = {
    user: rdsUser,
    password: rdsPassword,
    server: rdsServer,
    database: rdsDatabase
  };

  console.log(event);
  const userId = event.headers['userid'];
  const listingId = event['pathParameters']['listingId'];
  const comment = JSON.parse(event.body).comment;

  mssql.connect(config, (err) => {
    if (err) {
      console.log(err);
      callback(err);
    } else {
      const req = new mssql.Request();
      req.query('INSERT INTO [ListingComment] (Body, CreatedDateTime, CommentedBy, Listing) VALUES (N\'' + comment + '\', SYSDATETIMEOFFSET(), (SELECT Id FROM [User] WHERE UserId = \'' + userId + '\'), ' + listingId + ')')
        .then(() => {
          mssql.close();
          let response = {
            statusCode: 200,
            headers: {},
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
