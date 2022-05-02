const mssql = require('mssql')

const rdsUser = process.env.RDS_USER;
const rdsPassword = process.env.RDS_PASSWORD;
const rdsServer = process.env.RDS_SERVER;
const rdsDatabase = process.env.RDS_DATABASE;

exports.getAllListingsHandler = (event, context, callback) => {
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
      req.query(`
        SELECT
        	*,
        	(SELECT COUNT(*) FROM [AdoptionApplication] WHERE Listing = Listing.Id) AS ApplicationCount,
        	(SELECT COUNT(*) FROM [ListingComment] WHERE Listing = Listing.Id) AS CommentCount,
        	(SELECT COUNT(*) FROM [ListingLike] WHERE Listing = Listing.Id) AS LikeCount,
          (SELECT COUNT(*) FROM [AdoptionApplication] WHERE Listing = Listing.Id AND Applicant = (SELECT Id FROM [User] WHERE UserId = '` + userId + `')) AS MyApplicationCount,
        	(SELECT COUNT(*) FROM [ListingComment] WHERE Listing = Listing.Id AND CommentedBy = (SELECT Id FROM [User] WHERE UserId = '` + userId + `')) AS MyCommentCount,
        	(SELECT COUNT(*) FROM [ListingLike] WHERE Listing = Listing.Id AND LikedBy = (SELECT Id FROM [User] WHERE UserId = '` + userId + `')) AS MyLikeCount
        FROM [Listing]
      `)
        .then((result) => {
          let promises = result.recordset.map((res) => {
            return req.query('SELECT * FROM [User] WHERE Id = ' + res.ListedBy)
            .then((result2) => {
              res.user = result2.recordset;
              return res;
            })
            .catch((error2) => {
              console.log(error2);
            });
          });
          
          Promise.all(promises).then((finalResult) => {
            let promises2 = finalResult.map((finalRes) => {
              return req.query('SELECT * FROM [ListingImage] WHERE Listing = ' + finalRes.ID)
              .then((result3) => {
                finalRes.imageUrls = result3.recordset;
                return finalRes;
              })
              .catch((error3) => {
                console.log(error3);
              });
            });

            Promise.all(promises2).then((lastResult) => {
              mssql.close();
              let response = {
                statusCode: 200,
                headers: {},
                isBase64Encoded: false,
                body: JSON.stringify(lastResult)
              }
              callback(null, response);
            });
          });
        })
        .catch((error) => {
          console.log(error);
        })
    }
  });

  return null;
};
