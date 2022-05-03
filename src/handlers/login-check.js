const mssql = require('mssql')

const rdsUser = process.env.RDS_USER;
const rdsPassword = process.env.RDS_PASSWORD;
const rdsServer = process.env.RDS_SERVER;
const rdsDatabase = process.env.RDS_DATABASE;

exports.loginCheckHandler = (event, context, callback) => {
  const config = {
    user: rdsUser,
    password: rdsPassword,
    server: rdsServer,
    database: rdsDatabase
  };

  console.log(event);
  const userId = event.headers['userid'];
  const body = JSON.parse(event.body);
  console.log(body);
  const name = JSON.parse(event.body).name;
  console.log(body.name);
  const email = JSON.parse(event.body).email;
  const phone = JSON.parse(event.body).contact;

  mssql.connect(config, (err) => {
    if (err) {
      console.log(err);
      callback(err);
    } else {
      const req = new mssql.Request();
      req.query('SELECT COUNT(*) AS Count FROM [User] WHERE UserId = \'' + userId + '\'')
        .then((result) => {
          console.log(result);
          if (result.recordset[0].Count > 0) {
            console.log('do nothing');
            mssql.close();
            let response = {
              statusCode: 200,
              headers: {},
              isBase64Encoded: false,
              body: JSON.stringify(true)
            };
            callback(null, response);
          } else {
            console.log('to add');
            req.query('INSERT INTO [User] (Name, UserType, Email, Phone, UserId) VALUES (\'' + name + '\', \'User\', \'' + email + '\', \'' + phone + '\', \'' + userId + '\')')
              .then(() => {
                console.log('added');
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
