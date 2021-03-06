# RapidQL
[![](https://i.imgur.com/9iuHMLS.png)](http://rapidql.com)

**RapidQL** let's developer query multiple API resources at a time, combining them to create 1 unified Query.

[![NPM version](https://badge.fury.io/js/rapidql.svg)](https://www.npmjs.com/package/rapidql)
[![](https://circleci.com/gh/iddogino/rapidql.svg?style=shield&circle-token=70838eabb9e7255c543594d9c12d44db3e9b979e)](https://circleci.com/gh/iddogino/rapidql)

## Full Documentation
See the [RapidQL documentation](https://docs.rapidql.com)

## Initialization

After requiring the RapidQL package, you can initialize it. You may also pass options, such as RapidAPI credentials or default HTTP Parameters
```javascript
const RapidQL = require('RapidQL');
let rql = new RapidQL({
    Http : {
        X-RapidAPI-Header: '***********'
    },
    RapidAPI : {
        projectName : '########',
        apiKey: '##########'
    }
});
```
## Querying

You can perform queries using the method rql.query(). It takes 2 arguments:

1. The query string
2. *[optional]* A base context. You may use the base context for parameter passing (any parameters such as user name used in the query should be passed through the base context. The query string should be completely static).

Queries return promises. If the promise rejects, the returned value will be the error message. If the query resolves, the returned value will be the query result.
```javascript
//Running this query on this base context will return the object {a:1}
rql.query(`
{
    a
}
`, {
    a: 1,
    b: 2
}).then(console.log).catch(console.warn);
```

## Logging

Similarly to querying, you can directly log the results of your query using the rql.log() method. It takes 2 arguments:

1. The query string
2. *[optional]* A base context. You may use the base context for parameter passing (any parameters such as user name used in the query should be passed through the base context. The query string should be completely static).

Queries return promises. If the promise rejects, the returned value will be the error message. If the query resolves, the returned value will be the query result.
```javascript
//Running this query on this base context will return the object {a:1}
rql.log(`
{
    a
}
`, {
    a: 1,
    b: 2
})
```
## HTTP Requests
With RapidQL, you can also connect to any HTTP url using Http.get(). You may also use patch, post, and put requests.
```javascript
const RapidQL = require('RapidQL');
const rql = new RapidQL({});  

rql.log(`{
    Http.get(url:"http://httpbin.org/ip") {
        origin
    }
}`);
```

An HTTP request in RQL can take many parameters beyond the url. The params include:

- __url__: a fully qualified URI
- __body__: entity body for PATCH, POST and PUT requests (not usable on GET requests)
- __form__: data to pass for a multipart/form-data request (not usable on GET requests)
- __json__: a boolean that when true, sets body to JSON representation of value and adds the 
- __Content-type__: application/json header (not usable on GET requests)
- __headers__: HTTP headers (default: {})
- __bearer__: an OAuth bearer token
- __basic__: credentials for basic auth.

### Setting Default HTTP Parameters
When initializing your RapidQL instance, you can provide default parameters for HTTP requests by supplying an Http object as an option. This Http can set default parameters for headers, bearer, and basic. These parameters will then be sent with every HTTP request.
```javascript
const RapidQL = require('RapidQL');
const rql = new RapidQL({
    Http: {
        headers : {
            'X-RapidAPI-Key' : '*****************',
            'default' : 'this header will always be sent, unless defined otherwise at time of call'
        },
        basic : {
            username : 'my_username',
            password : 'my_password'
        }
    }
});

rql.log(`{
    Http.post(
        url:"http://httpbin.org/ip"
    ){
        
    }
}`)
```

### Escaping Strings
If you need to have a variable string within on of your queries (Ex/ URL parameters for an API) you're able to escape the string by using the following notation: {{variable_name}}. An example of how to use this is the following:
```javascript
const RapidQL = require('RapidQL');
const rql = new RapidQL({});

rql.log(`{
    Http.post(
        url:"http://httpbin.org/status/{{status_code}}"
    ){
      
    }
}`, {
  status_code: 400
})
```

## Sample queries

Get user from a database and do validation of both email and phone number
```javascript
rql.log(`{
  MySQL.public.users.find(username:input) {
    email,
    phoneNumber,
    name,
    - Telesign:Http.post(
      url: 'https://telesign-telesign-score-v1.p.rapidapi.com/score/{{phoneNumber}}',
      headers : {
        'Content-Type' : 'application/x-www-form-urlencoded'
      },
      params : {
        'account_lifecycle_event' : 'create'
      }
    ){
      phone_number_risk : risk
    },
    - Mailboxlayer:Http.get(
      url: 'https://apilayer-mailboxlayer-v1.p.rapidapi.com/check',
      headers : {
      },
      params : {
        smtp: '1',
        catch_all: '0',
        email: email,
        access_key: '************************'
      }
    ){
      email_score:score
    }
  }
}` , {
  input : 'rapidapi'
})
```

## DB Queries
RapidQL may also be used for querying databases. Database queries and API queries may be combined to create advance data gathering logic.

### Set Up
To add a database connection to your rql instance, you need to add it's connection details in the RapidQL initialization:
```javascript
const RapidQL = require('RapidQL');
const rql = new RapidQL({
    PostgreSQL: {
        Sample: {
            user: 'admin', //required
            database: 'compose', //required
            password: '#########', //required
            host: 'aws-us-east-1-portal.23.dblayer.com', // required
            port: 17052, //required
            max: 10, // optional - max connections
            idleTimeoutMillis: 30000 // optional - how long a client is allowed to remain idle before being closed
        }
    }
});
```

Once the RapidQL instance is connected to the DB, you may query it. The object you're querying will have the following schema:
```javascript
DBType.DBName.Schema.Table.Operation
```

Where:

- **DBType** : the type of DB you're querying (PostgreSQL, MySQL, Redis, etc...)
- **DBName** : the name you used when in configuring the DB (as you can be connected to multiple DBs of each type)
- **Schema** : the schema you wish to work with
- **Table** : name of the table to be queried

For example, `PostgreSQL.Sample.public.users.select` will query the `Sample` PostgreSQL DB (same sample we used in configuration above), and perform a `select` query on the `users` table in the `public` schema.

### Select
The most basic way to perform select queries is by passing equality comparisons:
```javascript
PostgreSQL.Sample.public.users.select(location: "US")
```

This will find all users where location is 'US'.

For more complex conditions use:
```javascript
PostgreSQL.Sample.public.users.select(birthyear: {"<=": "1997"})
```

This will find users whose birth year is smaller than or equal to 1997. Using `.select(location:"US") is shorthand for .select(location:{"=":"US"})` You can have multiple conditions, mixing between comparison styles:
```javascript
PostgreSQL.Sample.public.users.select(location: 'US', birthyear: {"<=": "1997"})
```

### Complex queries (SKIP, LIMIT, ORDER BY)

`PostgreSQL.Sample.public.users.select(location: "US")` is shorthand for `PostgreSQL.Sample.public.users.select(WHERE:{"location": "US"})`. Using the full syntax you may add skip, limit and order by clauses.
```javascript
PostgreSQL.Sample.public.users.select(WHERE:{"location": "US"}, LIMIT:"3", SKIP:"1", ORDERBY: {birthyear:"DESC"})
```

***Note case sensitivity.***

### Count
Count works just like select, only it returns the `count` value.
```javascript
{
    PostgreSQL.GCELogs.public.blockcalls.count(LIMIT:"10", GROUPBY:"package", ORDERBY:{count:"DESC"}) {
        package,
        count
    }
}
```

## Running in commandline
Install RapidQL from NPM with the `-g` flag to use from command line. Than, you can use:

    rql queryFile.rql

To run the query in `queryFile.rql`. RapidQL will also look for 2 optional hidden files:

- `.rqlconfig` - json file containing your configurations (DB / RpaidAPI connection details).
- `.rqlcontext` - base context for RQL (define variables used in the query).

## RQL Server
Install RapidQL from NPM with the `-g` flag to use from command line.
To use RQL from platforms other than nodejs, you can either use it as a command line executable (see above), or run it as a server. Running `rql-server` will set up an HTTP server, accepting RQL queries and returning their results in JSON format.

### Parameters:

- **-p** / **--port** : set the port rql will listen on. 3000 by default.
- **-c** / **--conf** : set the config file for rql to pull configurations from. By default - .rqlconfig at the same path.

### API:
