const mssql = require('mssql')

const rdsUser = process.env.RDS_USER;
const rdsPassword = process.env.RDS_PASSWORD;
const rdsServer = process.env.RDS_SERVER;
const rdsDatabase = process.env.RDS_DATABASE;

exports.updateUserHandler = (event, context, callback) => {
  const config = {
    user: rdsUser,
    password: rdsPassword,
    server: rdsServer,
    database: rdsDatabase
  };

  console.log(event);
  const userId = event.headers['userid'];
  const body = JSON.parse(event.body);
  const name = body.name;
  const age = body.age;
  const address = body.address;

  mssql.connect(config, (err) => {
    if (err) {
      console.log(err);
      callback(err);
    } else {
      const req = new mssql.Request();
      req.query('UPDATE [User] SET Name = \'' + name + '\', Age = ' + age + ', Address = \'' + address + '\' WHERE UserId = \'' + userId + '\'')
        .then((result) => {
          console.log(result);
          mssql.close();
          let response = {
            statusCode: 200,
            headers: {},
            isBase64Encoded: false,
            body: JSON.stringify(true)
          };
          callback(null, response);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  });

  return null;
};
