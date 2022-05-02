const mssql = require('mssql')

const rdsUser = process.env.RDS_USER;
const rdsPassword = process.env.RDS_PASSWORD;
const rdsServer = process.env.RDS_SERVER;
const rdsDatabase = process.env.RDS_DATABASE;

exports.applyListingHandler = (event, context, callback) => {
  const config = {
    user: rdsUser,
    password: rdsPassword,
    server: rdsServer,
    database: rdsDatabase
  };

  console.log(event);
  const userId = event.headers['userid'];
  const listingId = event['pathParameters']['listingId'];
  const comment = event.body['comment'];

  mssql.connect(config, (err) => {
    if (err) {
      console.log(err);
      callback(err);
    } else {
      const req = new mssql.Request();
      req.query('INSERT INTO [ListingComment] (Body, CreatedDateTime, CommentedBy, Listing) VALUES (N\'' + comment + '\', SYSDATETIMEOFFSET(), (SELECT Id FROM [User] WHERE UserId = \'' + userId + '\'), ' + listingId + ')')
        .then(() => {
          mssql.close();
          callback(null, true);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  });

  return null;
};