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
  const body = JSON.parse(event.body);
  const rating = body.rating === 0 ? null : body.rating;
  const targetUserId = body.targetUserId;

  mssql.connect(config, (err) => {
    if (err) {
      console.log(err);
      callback(err);
    } else {
      const req = new mssql.Request();
      req.query('SELECT UserType FROM [User] WHERE UserId = \'' + userId + '\'')
        .then((result) => {
          let ratingUserType = '';
          if (result.recordset[0].UserType === 'Shelter') {
            ratingUserType = 'ShelterRating';
          } else {
            ratingUserType = 'UserRating';
          }
          let sql = '';
          if (rating === null) {
            sql = 'UPDATE [AdoptionApplication] SET ' + ratingUserType + ' = NULL WHERE Id = ' + applicationId;
          } else {
            sql = 'UPDATE [AdoptionApplication] SET ' + ratingUserType + ' = \'' + rating + '\' WHERE Id = ' + applicationId;
          }
          req.query(sql)
            .then(() => {
              if (result.recordset[0].UserType === 'Shelter') {
                sql = 'SELECT ROUND(AVG(CAST(ShelterRating AS DECIMAL)), 2) AS AverageRating FROM [AdoptionApplication] WHERE Applicant = (SELECT Id FROM [User] WHERE UserId = \'' + targetUserId + '\')';
              } else {
                sql = 'SELECT ROUND(AVG(CAST(UserRating AS DECIMAL)), 2) AS AverageRating FROM [AdoptionApplication] aa INNER JOIN [Listing] li ON li.Id = aa.Listing WHERE li.ListedBy = (SELECT Id FROM [User] WHERE UserId = \'' + targetUserId + '\')';
              }
              req.query(sql)
                .then((result2) => {
                  console.log(result2.recordset);
                  req.query('UPDATE [User] SET Rating = \'' + result2.recordset[0].AverageRating + '\' WHERE UserId = \'' + targetUserId + '\'')
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
                    .catch((error4) => {
                      console.log(error4);
                    })
                })
                .catch((error3) => {
                  console.log(error3);
                });
            })
            .catch((error2) => {
              console.log(error2);
            });
        })
        .catch((error) => {
          console.log(error);
        });
    }
  });

  return null;
};
