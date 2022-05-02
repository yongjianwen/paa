const mssql = require('mssql')

const rdsUser = process.env.RDS_USER;
const rdsPassword = process.env.RDS_PASSWORD;
const rdsServer = process.env.RDS_SERVER;
const rdsDatabase = process.env.RDS_DATABASE;

exports.likeListingHandler = (event, context, callback) => {
  const config = {
    user: rdsUser,
    password: rdsPassword,
    server: rdsServer,
    database: rdsDatabase
  };

  console.log(event);
  const userId = event.headers['userid'];
  const listingId = event['pathParameters']['listingId'];

  mssql.connect(config, (err) => {
    if (err) {
      console.log(err);
      callback(err);
    } else {
      const req = new mssql.Request();
      req.query('SELECT COUNT(*) AS Count FROM [ListingLike] WHERE Listing = ' + listingId + ' AND LikedBy = (SELECT Id FROM [User] WHERE UserId = \'' + userId + '\')')
        .then((result) => {
          console.log(result);
          if (result.recordset[0].Count > 0) {
            console.log('to delete');
            req.query('DELETE [ListingLike] WHERE Listing = ' + listingId + ' AND LikedBy = (SELECT Id FROM [User] WHERE UserId = \'' + userId + '\')')
              .then(() => {
                console.log('deleted');
                mssql.close();
                let response = {
                  statusCode: 200,
                  headers: {},
                  isBase64Encoded: false,
                  body: JSON.stringify(true)
                };
                callback(null, response);
              })
              .catch((error2) => {
                console.log(error2);
              })
          } else {
            console.log('to add');
            req.query('INSERT INTO [ListingLike] (LikedBy, Listing) VALUES ((SELECT Id FROM [User] WHERE UserId = \'' + userId + '\'), ' + listingId + ')')
              .then(() => {
                console.log('added');
                mssql.close();
                let response = {
                  statusCode: 200,
                  headers: {},
                  isBase64Encoded: false,
                  body: JSON.stringify(true)
                };
                callback(null, response);
              })
              .catch((error3) => {
                console.log(error3);
              })
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  });

  return null;
};
