const mssql = require('mssql')

const rdsUser = process.env.RDS_USER;
const rdsPassword = process.env.RDS_PASSWORD;
const rdsServer = process.env.RDS_SERVER;
const rdsDatabase = process.env.RDS_DATABASE;

exports.putChatPairHandler = (event, context, callback) => {
  const config = {
    user: rdsUser,
    password: rdsPassword,
    server: rdsServer,
    database: rdsDatabase
  };

  console.log(event);
  const userId = event.headers['userid'];
  const body = JSON.parse(event.body);
  const targetUserId = body.targetUserId;
  const lastUser = body.lastUser;
  const lastMessage = body.lastMessage;

  mssql.connect(config, (err) => {
    if (err) {
      console.log(err);
      callback(err);
    } else {
      const req = new mssql.Request();
      req.query('SELECT COUNT(*) AS Count FROM [ChatPair] WHERE (User1 = \'' + userId + '\' AND User2 = \'' + targetUserId + '\') OR (User1 = \'' + targetUserId + '\' AND User2 = \'' + userId + '\')')
        .then((result) => {
          console.log(result);
          if (result.recordset[0].Count > 0) {
            console.log('to update');
            req.query('UPDATE [ChatPair] SET LastUser = \'' + lastUser + '\', \'' + lastMessage + '\', SYSDATETIMEOFFSET() WHERE (User1 = \'' + userId + '\' AND User2 = \'' + targetUserId + '\') OR (User1 = \'' + targetUserId + '\' AND User2 = \'' + userId + '\')')
              .then(() => {
                console.log('updated');
                mssql.close();
                let response = {
                  statusCode: 200,
                  headers: {},
                  isBase64Encoded: false,
                  body: JSON.stringify(true)
                };
                callback(null, response);
              })
              .catch((error2) => {
                console.log(error2);
              })
          } else {
            console.log('to add');
            req.query('INSERT INTO [ChatPair] (User1, User2, LastUser, LastMessage, LastDateTime) VALUES (\'' + userId + '\', \'' + targetUserId + '\', \'' + lastUser + '\', \'' + lastMessage + '\', SYSDATETIMEOFFSET())')
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
