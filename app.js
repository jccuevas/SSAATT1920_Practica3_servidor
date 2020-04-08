/* 
 * Servidor para la práctica 3
 */
const http = require('http');
const express = require('express');
const fs = require('fs');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const {parse} = require('querystring');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID; //Para poder emplear los objetos ID para referenciar documentos mongo

var url = "mongodb://localhost:27017/examenes";
mongoose.connect('mongodb://localhost:27017/examenes', {useNewUrlParser: true, useUnifiedTopology: true});
const RepositorySchema = mongoose.model('repository', {user: String, name: String});
var router = new express.Router();
const DEFAULT_PORT = 8084; //Puerto del servidor por defecto
var PORT = DEFAULT_PORT; //Para poder actualizarla por los argumentos del programa.


//Ruta a los recursos estáticos, normalmente CSS o html sin personalizar
app.use(express.static(__dirname + '/public'));
app.use(router);
/*
 * Para soportar CORS en todo tipo de métodos
 */

app.use((req, res, next) => {

//CORS
    console.log("[SERVIDOR] Petición entrante:" + req.method + " " + req.path);
    res.header("Access-Control-Allow-Origin", "*"); //Se debe especificar para emplear CORS (Cross-Origin Resource Sharing)
    res.header("Access-Control-Allow-Headers", "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    res.header("Allow", "GET, POST, OPTIONS, PUT, DELETE");
    // authorized headers for preflight requests
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
    app.options('*', (req, res) => {
        console.log("[SERVIDOR] Petición OPTIONS");
        // allowed XHR methods  
        res.header('Access-Control-Allow-Methods', 'GET, PATCH, PUT, POST, DELETE, OPTIONS');
        res.send();
    });
});
app.get("/test", function (req, res) {
    fs.readFile('public/examen.json', 'utf8', function (err, data) {
//        console.log(data);
//        res.writeHead(200, {'Content-Type': 'application/json'});
//        res.write(data);
//        res.end();
        res.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*", //Se debe especificar para emplear CORS (Cross-Origin Resource Sharing)
            "Access-Control-Allow-Headers": "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method",
            "Access-Control-Allow-Methods": "GET",
            "Allow": "GET"
        });
        res.end(data);
    });
});
app.get('/test/:name', function (req, res, next) {
    var options = {
        root: path.join(__dirname, 'public'),
        dotfiles: 'deny',
        headers: {
            'x-timestamp': Date.now(),
            'x-sent': true
        }
    };
    var fileName = "examen_" + req.params.name + ".json";
    res.sendFile(fileName, options, function (err) {
        if (err) {
            next(err);
            res.sendSstatus(404);
        } else {
            console.log('Sent:', fileName);
        }
    });
}
);
/**
 * Los datos se esperan en JSON
 */
app.post("/login", function (req, res) {
    console.log("POST /login");
    var body = "";
    req.on('data', function (chunk) {
        body += chunk;
    });
    req.on('end', function () {
        console.log('POSTed: ' + body);
        try {
            if (authenticate(JSON.parse(body))) {
                res.writeHead(200, {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Access-Control-Allow-Origin": "*", //Se debe especificar para emplear CORS (Cross-Origin Resource Sharing)
                    "Access-Control-Allow-Headers": "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
                    "Allow": "GET, POST, PUT, DELETE"
                });
            } else {
                res.writeHead(403, {//Acceso denegado
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Access-Control-Allow-Origin": "*", //Se debe especificar para emplear CORS (Cross-Origin Resource Sharing)
                    "Access-Control-Allow-Headers": "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
                    "Allow": "GET, POST, PUT, DELETE"
                });
            }
        } catch (error) {
            res.writeHead(400, {//Acceso denegado
                "Content-Type": "application/x-www-form-urlencoded",
                "Access-Control-Allow-Origin": "*", //Se debe especificar para emplear CORS (Cross-Origin Resource Sharing)
                "Access-Control-Allow-Headers": "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
                "Allow": "GET, POST, PUT, DELETE"
            });
        }
        res.end(body);
    });
});
app.route("/repository")
        .put(function (req, res) {
            console.log("PUT /repository");
            var body = "";
            req.on('data', function (chunk) {
                body += chunk;
            });
            req.on('end', function () {

//                try {
                let repository = JSON.parse(body);
                console.log("PUT /repository data: " + JSON.stringify(repository));
                const rep = new RepositorySchema(repository);
                rep.save()
                        .then(() => {
                            console.log("200 PUT /repository Añadido: " + JSON.stringify(repository));
                            res.writeHead(200, {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'Access-Control-Allow-Origin': '*', //Se debe especificar para emplear CORS (Cross-Origin Resource Sharing) 
                                "Access-Control-Allow-Headers": "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method",
                                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
                                "Allow": "GET, POST, PUT, DELETE"
                            });
                            res.end(body);
                        })
                        .catch((error) => {
                            console.log("500 PUT /repository ERROR: " + error.toString());
                            res.writeHead(500, {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'Access-Control-Allow-Origin': '*', //Se debe especificar para emplear CORS (Cross-Origin Resource Sharing) 
                                "Access-Control-Allow-Headers": "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method",
                                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
                                "Allow": "GET, POST, PUT, DELETE"
                            });
                            res.end(body);
                        });
            });
        }
        )
        .get(function (request, response) {
            console.log("GET /repository");
            //var query = RepositorySchema.find({}, null, {limit: 5});
            var query = RepositorySchema.find({}, null, {limit: 5});
            query.exec()
                    .then((result) => {
                        repositories = JSON.stringify(result);
                        console.log("GET /repository Listado: " + repositories);
                        console.log("200 GET /repository");
                        response.writeHead(200, {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*' //Se debe especificar para emplear CORS (Cross-Origin Resource Sharing)
                        });
                        response.end(repositories);
                    })
                    .catch((error) => {
                        console.log("500 GET /repository Listado: " + error.toString());
                        response.writeHead(500, {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*' //Se debe especificar para emplear CORS (Cross-Origin Resource Sharing)
                        });
                        response.end();
                    });
//            MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, function (err, db) {
//                let repositories = "[";
//                if (err) {
//                    throw err;
//                }
//                var dbo = db.db("examenes");
//                
//                dbo.collection("repositories").find({}).toArray(function (err, result) {
//                    if (err) {
//                        throw err;
//                    }
//
//                    repositories = JSON.stringify(result);
//                    console.log("Listado: " + repositories);
//                    db.close();
//                    console.log("200 GET /repository");
//                    response.writeHead(200, {
//                        'Content-Type': 'application/json',
//                        'Access-Control-Allow-Origin': '*' //Se debe especificar para emplear CORS (Cross-Origin Resource Sharing)
//                    });
//
//                    response.end(repositories);
//                });
//        });
        }
        );
app.route("/repository/:id")
        .delete(function (request, response) {
            console.log("DELETE /repository/" + request.params.id);
            MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, function (err, db) {
                if (err) {
                    console.log("500 DELETE /repository/" + request.params.id);
                    response.writeHead(500, {
                        'Access-Control-Allow-Origin': '*', //Se debe especificar para emplear CORS (Cross-Origin Resource Sharing)
                        "Access-Control-Allow-Headers": "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method",
                        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
                        "Allow": "GET, POST, PUT, DELETE"
                    });
                    response.end();
                }

                var dbo = db.db("examenes");
                var postId = new ObjectID(request.params.id);
                dbo.collection("repositories").deleteOne({"_id": postId}, function (err, obj) {
                    if (err) {
                        db.close();
                        console.log("404 DELETE /repository/" + request.params.id);
                        response.writeHead(404, {
                            'Access-Control-Allow-Origin': '*', //Se debe especificar para emplear CORS (Cross-Origin Resource Sharing)
                            "Access-Control-Allow-Headers": "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method",
                            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
                            "Allow": "GET, POST, PUT, DELETE"
                        });
                    } else {
                        console.log("Deleted result: " + JSON.stringify(obj.result));
                        db.close();
                        console.log("200 DELETE /repository/" + request.params.id);
                        response.writeHead(200, {
                            'Access-Control-Allow-Origin': '*', //Se debe especificar para emplear CORS (Cross-Origin Resource Sharing)
                            "Access-Control-Allow-Headers": "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method",
                            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
                            "Allow": "GET, POST, PUT, DELETE"
                        });
                    }
                    response.end();
                });
            });
        })
        .get(function (request, response) {
            console.log("GET /repository/" + request.params.id);
            MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, function (err, db) {
                let repositories = "[";
                if (err) {
                    console.log("500 GET /repository/");
                    response.writeHead(500, {
                        'Access-Control-Allow-Origin': '*', //Se debe especificar para emplear CORS (Cross-Origin Resource Sharing)
                        "Access-Control-Allow-Headers": "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method",
                        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
                        "Allow": "GET, POST, PUT, DELETE"
                    });
                    response.end();
                } else {
                    var dbo = db.db("examenes");
                    dbo.collection("repositories").find({"user": request.params.id}).toArray(function (err, result) {
                        if (err) {
                            console.log("404 GET /repository/");
                            response.writeHead(404, {
                                'Access-Control-Allow-Origin': '*', //Se debe especificar para emplear CORS (Cross-Origin Resource Sharing)
                                "Access-Control-Allow-Headers": "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method",
                                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
                                "Allow": "GET, POST, PUT, DELETE"
                            });
                            response.end();
                        } else {

                            repositories = JSON.stringify(result);
                            console.log("Listado: " + repositories);
                            db.close();
                            console.log("200 GET /repository/");
                            response.writeHead(200, {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*', //Se debe especificar para emplear CORS (Cross-Origin Resource Sharing)
                                "Access-Control-Allow-Headers": "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method",
                                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
                                "Allow": "GET, POST, PUT, DELETE"
                            });
                            response.end(repositories);
                        }
                    });
                }
            });
        });



app.route("/question")
        .put(function (req, res) {
            console.log("PUT /question");
            var body = "";
            req.on('data', function (chunk) {
                body += chunk;
            });
            req.on('end', function () {
                console.log('PUT: ' + body);
                try {
                    let repository = JSON.parse(body);
                    MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, function (err, db) {
                        if (err)
                            throw err;
                        var dbo = db.db("examenes");
                        dbo.collection("question").insertOne(repository, function (err, result) {
                            if (err) {
                                res.writeHead(403, {//Acceso denegado
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                    'Access-Control-Allow-Origin': '*', //Se debe especificar para emplear CORS (Cross-Origin Resource Sharing)
                                    "Access-Control-Allow-Headers": "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method",
                                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
                                    "Allow": "GET, POST, PUT, DELETE"
                                });
                                res.end(null);
                            } else {
                                res.writeHead(200, {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                    'Access-Control-Allow-Origin': '*', //Se debe especificar para emplear CORS (Cross-Origin Resource Sharing) 
                                    "Access-Control-Allow-Headers": "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method",
                                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
                                    "Allow": "GET, POST, PUT, DELETE"

                                });
                                res.end(body);
                                console.log("1 question inserted: " + body);
                                db.close();
                            }
                        });
                    });
                } catch (error) {
                    res.writeHead(400, {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Access-Control-Allow-Origin': '*', //Se debe especificar para emplear CORS (Cross-Origin Resource Sharing) 
                        "Access-Control-Allow-Headers": "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method",
                        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
                        "Allow": "GET, POST, PUT, DELETE"

                    });
                    res.end(null);
                }

            });
        })
        .get(function (request, response) {
            console.log("GET /question");
            MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, function (err, db) {
                let questions = "[";
                if (err) {

                    throw err;
                }
                var dbo = db.db("examenes");
                dbo.collection("question").find({}).toArray(function (err, result) {
                    if (err) {
                        throw err;
                    }

                    questions = JSON.stringify(result);
                    console.log("Listado: " + questions);
                    db.close();
                    response.writeHead(200, {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*' //Se debe especificar para emplear CORS (Cross-Origin Resource Sharing)
                    });
                    response.end(questions);
                });
            });
        });
function authenticate(data) {
    if ((data.user === "usuario" || data.user === "usuario2") && data.password === "12345") {
        console.log("SERVER[OK]: <" + data.user + "> se ha autenticado correctamente");
        return true;
    } else {
        console.log("SERVER[ERROR]: <" + data.user + "> no se ha autenticado correctamente");
        return false;
    }
}

let model_repository = {
    "user": "",
    "name": ""
};
function checkRepository(data) {
    for (let item in model_repository) {
        if (data[item] === undefined)
            return false;
    }
    return true;
}

function newRepository(data) {
    if (data.user === "usuario" || data.user === "usuario2") {
        try {
            addRepository(data);
            console.log("SERVER[OK]: <" + data.name + "> creado correctamente");
            return true;
        } catch (err) {
            console.log("SERVER[OK]: <" + data.name + "> creado correctamente");
            return false;
        }
    } else {
        console.log("SERVER[ERROR]: repositorio <" + data.name + "> no se tienen permisos");
        return false;
    }


}

function addRepository(data) {
    MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, function (err, db) {
        if (err)
            throw err;
        var dbo = db.db("examenes");
        dbo.collection("repositories").insertOne(data, function (err, res) {
            if (err)
                throw err;
            console.log("1 document inserted: " + JSON.stringify(data));
            db.close();
        });
    });
}

function getAllRepositories() {
    let repositories = "[";
    MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, function (err, db) {

        if (err)
            throw err;
        var dbo = db.db("examenes");
        dbo.collection("repositories").find({}).toArray(function (err, result) {
            if (err)
                throw err;
            repositories = JSON.stringify(result);
            console.log("Listado: " + repositories);
            db.close();
            return repositories;
        });
    });
}
//Nos quedamos con el primer parámetro de la líneas de comandos (que es el tercero. el primero el nombre del programa, el segundo la ruta
let argumentos = process.argv.slice(2);
//El primer parámetro se convierte en el puerto
console.log(argumentos);
if (argumentos.length > 0) {

    isNaN(parseInt(argumentos[0])) ? PORT = DEFAULT_PORT : PORT = parseInt(argumentos[0]);
    console.log("Nuevo puerto de escucha del servidor:" + PORT);
}
//Se busca la ip del host
require('dns').lookup(require('os').hostname(), function (err, add, fam) {


    console.log('IP del servidor: ' + add.toString());
    //Se inicia el servidor una vez se ha buscado la ip
    app.listen(PORT, add.toString(), () => {
        console.log(`Servidor corriendo en http://${add}:${PORT}`);
    });
});
//app.listen(PORT,add.toString());


