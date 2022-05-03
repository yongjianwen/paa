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
      req.query(`
        SELECT
          aa.*, li.Name AS ListingName, us.Name AS UserName, img.FileName, us.UserId AS TargetUserId
        FROM [AdoptionApplication] aa
        INNER JOIN [Listing] li ON li.Id = aa.Listing
        INNER JOIN [User] us ON us.Id = li.ListedBy
        LEFT JOIN [ListingImage] img ON img.Listing = li.Id AND img.Id = (SELECT MIN(img2.Id) FROM [ListingImage] img2 WHERE img2.Listing = li.Id)
        WHERE Applicant = (SELECT Id FROM [User] WHERE UserId = \'` + userId + `\') AND aa.Id = ` + applicationId
      )
        .then((result) => {
          req.query('SELECT * FROM [AdoptionApplicationDetail] WHERE AdoptionApplication = ' + applicationId + ' ORDER BY CreatedDateTime')
            .then((result2) => {
              result.recordset[0].details = result2.recordset;
              mssql.close();
              let response = {
                statusCode: 200,
                headers: {},
                isBase64Encoded: false,
                body: JSON.stringify(result.recordset)
              };
              callback(null, response);
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
