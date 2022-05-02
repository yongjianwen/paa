const mssql = require('mssql')

const rdsUser = process.env.RDS_USER;
const rdsPassword = process.env.RDS_PASSWORD;
const rdsServer = process.env.RDS_SERVER;
const rdsDatabase = process.env.RDS_DATABASE;

exports.getListingByIdHandler = (event, context, callback) => {
  const config = {
    user: rdsUser,
    password: rdsPassword,
    server: rdsServer,
    database: rdsDatabase
  };

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
        	(SELECT COUNT(*) FROM [ListingLike] WHERE Listing = Listing.Id) AS LikeCount
        FROM [Listing] WHERE Id = 
      ` + event['pathParameters']['listingId'].toString())
        .then((result) => {
          let promises = result.recordset.map((res) => {
            return req.query('SELECT * FROM [User] WHERE Id = ' + res.ListedBy)
            .then((result2) => {
              res.user = result2.recordset;
              return res
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

            Promise.all(promises2).then((finalFinalResult) => {
              let promises3 = finalFinalResult.map((finalFinalRes) => {
                return req.query('SELECT * FROM [ListingComment] WHERE Listing = ' + finalFinalRes.ID)
                .then((result4) => {
                  finalFinalRes.comments = result4.recordset;
                  return finalFinalRes;
                })
                .catch((error4) => {
                  console.log(error4);
                });
              });
  
              Promise.all(promises3).then((lastResult) => {
                mssql.close();
                callback(null, lastResult);
              });
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
