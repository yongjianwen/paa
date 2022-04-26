const mssql = require('mssql')

exports.getAllListingsHandler = (event, context, callback) => {
  console.log('hello world');

  //context.callbackWaitsForEmptyEventLoop = true

  const config = {
    user: 'admin',
    password: 'nxKFl7g7mxvExrkOqweP',
    server: 'paa.cp6tsxfewlsf.ap-southeast-1.rds.amazonaws.com',
    database: 'paa'
  };

  let query = 'SELECT * FROM [Listing]'

  mssql.connect(config, (err) => {
    if (err) {
      console.log(err);
      callback(err);
    } else {
      const req = new mssql.Request();
      req.query(query, (error, result) => {
        if (error) {
          console.log(error);
          callback(error);
        } else {
          console.log(result);
          mssql.close();
          callback(null, result.recordset);
        }
      });
    }
  });

  console.log('after connect')

  return "error";
};
