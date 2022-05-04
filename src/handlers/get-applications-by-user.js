const mssql = require('mssql')

const rdsUser = process.env.RDS_USER;
const rdsPassword = process.env.RDS_PASSWORD;
const rdsServer = process.env.RDS_SERVER;
const rdsDatabase = process.env.RDS_DATABASE;

exports.getApplicationsByUserHandler = (event, context, callback) => {
  const config = {
    user: rdsUser,
    password: rdsPassword,
    server: rdsServer,
    database: rdsDatabase
  };

  console.log(event);
  const userId = event.headers['userid'];

  mssql.connect(config, (err) => {
    if (err) {
      console.log(err);
      callback(err);
    } else {
      const req = new mssql.Request();
      req.query('SELECT UserType FROM [User] WHERE UserId = \'' + userId + '\'')
        .then((result) => {
          console.log(result.recordset);
          if (result.recordset[0].UserType === 'Shelter') {
            req.query(`
              SELECT
                aa.*, li.Name AS ListingName, us.Name AS UserName, img.FileName, us.UserId AS TargetUserId, us.ProfilePictureUrl
              FROM [AdoptionApplication] aa
              INNER JOIN [Listing] li ON li.Id = aa.Listing
              INNER JOIN [User] us ON us.Id = aa.Applicant
              LEFT JOIN [ListingImage] img ON img.Listing = li.Id AND img.Id = (SELECT MIN(img2.Id) FROM [ListingImage] img2 WHERE img2.Listing = li.Id)
              WHERE li.ListedBy = (SELECT Id FROM [User] WHERE UserId = \'` + userId + `\')
            `)
              .then((result2) => {
                mssql.close();
                let response = {
                  statusCode: 200,
                  headers: {},
                  isBase64Encoded: false,
                  body: JSON.stringify(result2.recordset)
                };
                callback(null, response);
              })
              .catch((error2) => {
                console.log(error2);
              });
          } else {
            req.query(`
              SELECT
                aa.*, li.Name AS ListingName, us.Name AS UserName, img.FileName, us.UserId AS TargetUserId, us.ProfilePictureUrl
              FROM [AdoptionApplication] aa
              INNER JOIN [Listing] li ON li.Id = aa.Listing
              INNER JOIN [User] us ON us.Id = li.ListedBy
              LEFT JOIN [ListingImage] img ON img.Listing = li.Id AND img.Id = (SELECT MIN(img2.Id) FROM [ListingImage] img2 WHERE img2.Listing = li.Id)
              WHERE aa.Applicant = (SELECT Id FROM [User] WHERE UserId = \'` + userId + `\')
            `)
              .then((result2) => {
                mssql.close();
                let response = {
                  statusCode: 200,
                  headers: {},
                  isBase64Encoded: false,
                  body: JSON.stringify(result2.recordset)
                };
                callback(null, response);
              })
              .catch((error2) => {
                console.log(error2);
              });
          }
        })
        .catch((error) => {
          console.log(error);
        })
    }
  });

  return null;
};
