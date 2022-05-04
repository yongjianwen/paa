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
  const applicationId = event['pathParameters']['applicationId'];
  const action = JSON.parse(event.body).action;

  mssql.connect(config, (err) => {
    if (err) {
      console.log(err);
      callback(err);
    } else {
      const req = new mssql.Request();
      // Pending, Cancelled, Confirmed, Rejected, Completed
      let status = '';
      if (action.toLowerCase() === 'confirm') {
        status = 'Confirmed';
      } else if (action.toLowerCase() === 'reject') {
        status = 'Rejected';
      } else if (action.toLowerCase() === 'complete') {
        status = 'Completed';
      }

      req.query('UPDATE [AdoptionApplication] SET Status = \'' + status + '\' WHERE Id = ' + applicationId)
        .then((result) => {
          req.query('INSERT INTO [AdoptionApplicationDetail] (Status, CreatedDateTime, AdoptionApplication) VALUES (\'' + status + '\', SYSDATETIMEOFFSET(), ' + applicationId + ')')
            .then((result2) => {
              if (status === 'Completed') {
                req.query('UPDATE [Listing] SET Status = \'Archived\' WHERE Id = (SELECT Listing FROM [AdoptionApplication] WHERE Id = ' + applicationId + ')')
                  .then((result3) => {
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
                  });
              } else {
                mssql.close();
                let response = {
                  statusCode: 200,
                  headers: {},
                  isBase64Encoded: false,
                  body: JSON.stringify(true)
                };
                callback(null, response);
              }
            })
            .catch((error2) => {
              console.log(error2);
            });
        })
        .catch((error) => {
          console.log(error);
        })
    }
  });

  return null;
};
