const mssql = require('mssql')

const rdsUser = process.env.RDS_USER;
const rdsPassword = process.env.RDS_PASSWORD;
const rdsServer = process.env.RDS_SERVER;
const rdsDatabase = process.env.RDS_DATABASE;

exports.confirmListingHandler = (event, context, callback) => {
  const config = {
    user: rdsUser,
    password: rdsPassword,
    server: rdsServer,
    database: rdsDatabase
  };

  console.log(event);
  const userId = event.headers['userid'];
  const listingId = event['pathParameters']['listingId'];
  const action = event.body['action'];
  let status = '';

  mssql.connect(config, (err) => {
    if (err) {
      console.log(err);
      callback(err);
    } else {
      const req = new mssql.Request();
      // Pending, Cancelled, Confirmed, Rejected, Completed
      if (action.toLowerCase() === 'confirm') {
        status = 'Confirmed';
      } else if (action.toLowerCase() === 'reject') {
        status = 'Rejected';
      } else if (action.toLowerCase() === 'complete') {
        status = 'Completed';
      }

      req.query('UPDATE [AdoptionApplication] SET Status = \'' + status + '\' WHERE Listing = ' + listingId + ' AND Applicant = (SELECT Id FROM [User] WHERE UserId = \'' + userId + '\')')
        .then((result) => {
          mssql.close();
          callback(null, true);
        })
        .catch((error) => {
          console.log(error);
        })
    }
  });

  return null;
};
