const mssql = require('mssql')

const rdsUser = process.env.RDS_USER;
const rdsPassword = process.env.RDS_PASSWORD;
const rdsServer = process.env.RDS_SERVER;
const rdsDatabase = process.env.RDS_DATABASE;

exports.getApplicationByUserAndIdHandler = (event, context, callback) => {
  const config = {
    user: rdsUser,
    password: rdsPassword,
    server: rdsServer,
    database: rdsDatabase
  };

  console.log(event);
  const userId = event.headers['userid'];
  const applicationId = event['pathParameters']['applicationId'];

  mssql.connect(config, (err) => {
    if (err) {
      console.log(err);
      callback(err);
    } else {
      const req = new mssql.Request();
      req.query('SELECT UserType FROM [User] WHERE UserId = \'' + userId + '\'')
        .then((result) => {
          if (result.recordset[0].UserType === 'Shelter') {
            req.query(`
              SELECT
                aa.*, li.Name AS ListingName, us.Name AS UserName, img.FileName, us.UserId AS TargetUserId, us.Name AS ApplicantName, us.Address AS ApplicantAddress, us.Email AS ApplicantEmail, us.Phone AS ApplicantContact
              FROM [AdoptionApplication] aa
              INNER JOIN [Listing] li ON li.Id = aa.Listing
              INNER JOIN [User] us ON us.Id = aa.Applicant
              LEFT JOIN [ListingImage] img ON img.Listing = li.Id AND img.Id = (SELECT MIN(img2.Id) FROM [ListingImage] img2 WHERE img2.Listing = li.Id)
              WHERE li.ListedBy = (SELECT Id FROM [User] WHERE UserId = \'` + userId + `\') AND aa.Id = ` + applicationId
            )
              .then((result2) => {
                req.query('SELECT * FROM [AdoptionApplicationDetail] WHERE AdoptionApplication = ' + applicationId + ' ORDER BY CreatedDateTime')
                  .then((result3) => {
                    result2.recordset[0].details = result3.recordset;
                    mssql.close();
                    let response = {
                      statusCode: 200,
                      headers: {},
                      isBase64Encoded: false,
                      body: JSON.stringify(result2.recordset)
                    };
                    callback(null, response);
                  })
                  .catch((error3) => {
                    console.log(error3);
                  });
              })
              .catch((error2) => {
                console.log(error2);
              }); 
          } else {
            req.query(`
              SELECT
                aa.*, li.Name AS ListingName, us.Name AS UserName, img.FileName, us.UserId AS TargetUserId, us2.Name AS ApplicantName, us2.Address AS ApplicantAddress, us2.Email AS ApplicantEmail, us2.Phone AS ApplicantContact
              FROM [AdoptionApplication] aa
              INNER JOIN [Listing] li ON li.Id = aa.Listing
              INNER JOIN [User] us ON us.Id = li.ListedBy
              INNER JOIN [User] us2 ON us2.Id = aa.Applicant
              LEFT JOIN [ListingImage] img ON img.Listing = li.Id AND img.Id = (SELECT MIN(img2.Id) FROM [ListingImage] img2 WHERE img2.Listing = li.Id)
              WHERE aa.Applicant = (SELECT Id FROM [User] WHERE UserId = \'` + userId + `\') AND aa.Id = ` + applicationId
            )
              .then((result2) => {
                req.query('SELECT * FROM [AdoptionApplicationDetail] WHERE AdoptionApplication = ' + applicationId + ' ORDER BY CreatedDateTime')
                  .then((result3) => {
                    result2.recordset[0].details = result3.recordset;
                    mssql.close();
                    let response = {
                      statusCode: 200,
                      headers: {},
                      isBase64Encoded: false,
                      body: JSON.stringify(result2.recordset)
                    };
                    callback(null, response);
                  })
                  .catch((error3) => {
                    console.log(error3);
                  });
              })
              .catch((error2) => {
                console.log(error2);
              }); 
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  });

  return null;
};
