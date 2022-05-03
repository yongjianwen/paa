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

  mssql.connect(config, (err) => {
    if (err) {
      console.log(err);
      callback(err);
    } else {
      const req = new mssql.Request();
      // Pending, Cancelled, Confirmed, Rejected, Completed
      req.query('SELECT COUNT(*) AS Count FROM [AdoptionApplication] WHERE Status = \'Pending\' AND Listing = ' + listingId + ' AND Applicant = (SELECT Id FROM [User] WHERE UserId = \'' + userId + '\')')
        .then((result) => {
          console.log(result);
          if (result.recordset[0].Count > 0) {
            console.log('to delete');
            req.query('SELECT TOP 1 Id FROM [AdoptionApplication] WHERE Status = \'Pending\' AND Listing = ' + listingId + ' AND Applicant = (SELECT Id FROM [User] WHERE UserId = \'' + userId + '\')')
              .then((result3) => {
                let applicationId = result3.recordset[0].ID;
                req.query('UPDATE [AdoptionApplication] SET Status = \'Cancelled\' WHERE Id = ' + applicationId)
                  .then(() => {
                    console.log('deleted');
                    req.query('INSERT INTO [AdoptionApplicationDetail] (Status, CreatedDateTime, AdoptionApplication) VALUES (\'Cancelled\', SYSDATETIMEOFFSET(), ' + applicationId + ')')
                      .then((result2) => {
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
                  })
                  .catch((error2) => {
                    console.log(error2);
                  })
              })
              .catch((error3) => {
                console.log(error3);
              })
          } else {
            console.log('to add');
            req.query('INSERT INTO [AdoptionApplication] (Status, Applicant, Listing) VALUES (\'Pending\', (SELECT Id FROM [User] WHERE UserId = \'' + userId + '\'), ' + listingId + ')')
              .then(() => {
                console.log('added');
                req.query('INSERT INTO [AdoptionApplicationDetail] (Status, CreatedDateTime, AdoptionApplication) VALUES (\'Pending\', SYSDATETIMEOFFSET(), (SELECT TOP 1 Id FROM [AdoptionApplication] WHERE Status = \'Pending\' AND Listing = ' + listingId + ' AND Applicant = (SELECT Id FROM [User] WHERE UserId = \'' + userId + '\')))')
                  .then((result2) => {
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
