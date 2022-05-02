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
      req.query('SELECT * FROM [Listing] WHERE Id = ' + '1')
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
            //console.log(finalResult);
            callback(null, finalResult);
          });
        })
        .catch((error) => {
          console.log(error);
        })
    }
  });

  return null;
};
