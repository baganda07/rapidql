/**
 * Created by iddo on 3/10/17.
 */
const SEP_CHAR = '.';

const mysql = require('mysql'),
    LeafNode = require('./../../LeafNode'),
    CompositeNode = require('./../../CompositeNode');

const functions = {
    find: require('./functions/find'),
    count: require('./functions/count')
};

class MySQLNode {
    constructor(name, children, args) {
        this.name = name;
        this.args = args;
        this.children = children;
    }

    getName() {
        return "MySQL." + this.name;
    }

    //noinspection JSAnnotator
    eval(context, ops) {
        const self = this;

        return new Promise((resolve, reject) => {
            //De-tokenize function call: DBName.DBSchema.DBTable.operation
            const tokenizedName = this.name.split(SEP_CHAR);
            const DBName = tokenizedName[1],
                DBTable = tokenizedName[2],
                operation = tokenizedName[3];

            //Check operation exists
            if(!functions.hasOwnProperty(operation))
                return reject(`Operation Error: operation ${operation} does not exist / is not supported`);

            //Create DB connection
            //Check configs exist
            if (!ops.hasOwnProperty('MySQL')) {
                return reject(`Missing configs: MySQL settings are missing`);
            } else if (!ops['MySQL'].hasOwnProperty(DBName)) {
                return reject(`Missing configs: MySQL settings for DB ${DBName} are missing`);
            } else {
                const dbConfigs = ops.MySQL[DBName];
                const dbConnection = mysql.createConnection(dbConfigs);
                dbConnection.connect((err) => {
                    if(err) {
                        return reject(`DB Error: Error connecting to database ${DBName} -> ${err}`);
                    }

                    //Route different functions
                    functions[operation](DBTable, dbConnection, self.args)
                        .then((payload) => {
                            resolve(payload);
                        })
                        .catch(reject);
                });
            }
        });
    }
}

module.exports = MySQLNode;