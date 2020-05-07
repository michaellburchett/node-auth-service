const config = require("../config.json");
const { exec } = require('child_process');

switch (config.database) {
    case "mysql":

        console.log("Running Migrations...");

        exec('npx sequelize-cli db:migrate', (err, stdout, stderr) => {
            if (err) {
              //some err occurred
              console.error(err)
            } else {
             // the *entire* stdout and stderr (buffered)
             console.log(`stdout: ${stdout}`);
             console.log(`stderr: ${stderr}`);
            }
        });
        
        break;
}