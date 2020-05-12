/*
 * -- PRÁCTICA 3 --
 * Servidor Node.JS para la práctica 3
 * ASIGNATURA: Servicios y Aplicaciones Telemáticas 
 * TITULACIÓN: Grado en Ingeniería de tecnologías de telecomunicación (14312020)
 * TITULACIÓN: Doble Grado Ing. de tecnologías de la telecomunicación e Ing. telemática (15212007)
 * TITULACIÓN: Grado en Ingeniería telemática (14512016)
 * CENTRO: ESCUELA POLITÉCNICA SUPERIOR (LINARES)
 * CURSO ACADÉMICO: 2019-2020
 * AUTOR: Juan Carlos Cuevas Martínez
 * 
 */
//Módulos a emplear en la práctica
const http = require('http'); //Módulo de conexiones HTTP
const express = require('express'); //Módulo de express
const MongoClient = require('mongodb').MongoClient; // Módulo de gestión MongoDB
const ObjectID = require('mongodb').ObjectID; // Modulo para poder emplear los objetos ID para referenciar documentos mongo
const mongoose = require('mongoose');//Módulo para emplear Mongoose
const bodyParser = require('body-parser');//Analiza el cuerpo de la petición POST

const Mustache = require("mustache");
const mustacheExpress = require("mustache-express");


//Para mostrar la IP
const os = require('os'); //Módulo de información relativa al sistema operativo y el host
const dns = require('dns'); //Módulo para emplear el servicio DNS

const app = express(); //Instancia de Express
const router = new express.Router(); //Encaminador Express para peticiones
app.use(router);
const url = "mongodb://localhost:27017/examenes"; //URL de la base de datos MongoDB



const jsonParser = bodyParser.json(); //application/json



const DEFAULT_PORT = 8083; //Puerto del servidor por defecto
const PORT = DEFAULT_PORT; //Para poder actualizarla por los argumentos del programa.


//Ruta a los recursos estáticos, normalmente CSS o html sin personalizar
app.use(express.static(__dirname + '/public'));

//Establezco el motor de plantilla para Mustache
app.engine("html", mustacheExpress());

//Defino la extensión por defecto para las plantillas
app.set("view engine", "html");

//Ruta para las vistas mustache
app.set("views", "./views");

app.route("/repository")
        .put(jsonParser, function (req, res) {
            console.log("PUT /repository");
            try {
                console.log("Recibido: " + JSON.stringify(req.body));
                MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, function (err, client) {
                    if (err) {
                        res.status(500);
                        res.end();
                    } else {
                        let db = client.db("examenes");
                        db.collection("repositories").insertOne(req.body, function (err, result) {
                            if (err) {
                                res.status(500);
                                res.end();
                            } else {
                                res.status(200);
                                res.end();
                            }
                        });
                    }
                });
            } catch (ex) {
                console.log("Error " + ex.toString());
                res.status(400);
                res.end();
            }

        })
        .get(function (req, res) {
            console.log("GET /repository");

            MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, function (err, client) {
                if (err) {
                    res.status(500);
                    res.end();
                } else {
                    let db = client.db("examenes");
                    db.collection("repositories").find().toArray(function (err, result) {
                        if (err) {
                            res.status(500);
                            res.end();
                        } else {
                            console.log("Datos leido: " + JSON.stringify(result));
                            res.status(200);
                            res.type("application/json");
                            res.end(JSON.stringify(result));
                        }
                    });
                }
            });
        });

app.route("/repository/:id")
        .delete(function (req, res) {
            console.log("DELETE /repository/" + req.params.id);

        });


app.get("/show/repository", function (req, res) {
    console.log("GET /repository/show");
    MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, function (err, client) {
        if (err) {
            res.status(500);
            res.end();
        } else {
            let db = client.db("examenes");
            db.collection("repositories").find().toArray(function (err, result) {
                if (err) {
                    res.status(500);
                    res.end();
                } else {
                    console.log("Datos leido: " + JSON.stringify(result));
                    res.render("main", {"repositories": result}, function (err, html) {
                        if (err) {
                            res.status(500);
                            res.end();
                        } else {
                            res.status(200);
                            res.type("text/html");
                            res.end(html);
                        }
                    });
                    //res.status(200);
                    //res.type("application/json");
                    //res.end(JSON.stringify(result));
                }
            });
        }
    });
});

/**
 * Servicio de autenticación
 * Los datos se esperan en JSON
 */
app.post("/login", jsonParser, function (req, res) {
    console.log("POST /login ");
    console.log('POSTed: ' + JSON.stringify(req.body));
    try {
        if (authenticate(req.body)) {
            res.writeHead(200, {
                "Content-Type": "application/x-www-form-urlencoded"
            });
        } else {
            res.writeHead(403, {//Acceso denegado
                "Content-Type": "application/x-www-form-urlencoded"
            });
        }
    } catch (error) {
        res.writeHead(400, {//Acceso denegado
            "Content-Type": "application/x-www-form-urlencoded"
        });
    }
    res.end();
});

/*
 * Autenticación básica
 * @param {type} data JSON con usuario y clave
 * @returns {Boolean} true si se autentica, false en otro caso.
 */
function authenticate(data) {
    if ((data.user === "usuario" || data.user === "usuario2") && data.password === "12345") {
        console.log("SERVER[OK]: <" + data.user + "> se ha autenticado correctamente");
        return true;
    } else {
        console.log("SERVER[ERROR]: <" + data.user + "> no se ha autenticado correctamente");
        return false;
    }
}

/*
 * Servico /question
 * put: añadir nueva pregunta
 * get: obtener lista de preguntas
 */
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
                    let question = JSON.parse(body);
                    MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, function (err, client) {
                        if (err)
                            throw err;
                        var db = client.db("examenes");
                        db.collection("question").insertOne(question, function (err, result) {
                            if (err) {
                                res.writeHead(403, {//Acceso denegado
                                    'Content-Type': 'application/x-www-form-urlencoded'//,
                                });
                                res.end(body);
                            } else {
                                res.writeHead(200, {
                                    'Content-Type': 'application/x-www-form-urlencoded'//,
                                });
                                res.end(body);
                            }
                            console.log("1 question inserted: " + body);
                            client.close();
                        });
                    });
                } catch (error) {
                    res.writeHead(400, {
                        'Content-Type': 'application/x-www-form-urlencoded'//,
                    });
                    res.end(body);
                }

            });
        })
        .get(function (request, response) {
            console.log("GET /question");
            MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, function (err, client) {
                let questions = "[";
                if (err) {
                    throw err;
                }
                var db = client.db("examenes");
                db.collection("question").find({}).toArray(function (err, result) {
                    if (err) {
                        throw err;
                    }
                    questions = JSON.stringify(result);
                    console.log("Listado: " + questions);
                    client.close();
                    response.writeHead(200, {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*' //Se debe especificar para emplear CORS (Cross-Origin Resource Sharing)
                    });
                    response.end(questions);
                });
            });
        });


//Inicio del programa con parámetros.
//Nos quedamos con el primer parámetro de la líneas de comandos (que es el tercero, el primero el nombre del programa, el segundo la ruta)
let argumentos = process.argv.slice(2);
//El primer parámetro se convierte en el puerto
console.log("Argumentos de petición:" + argumentos);
if (argumentos.length > 0) {
    isNaN(parseInt(argumentos[0])) ? PORT = DEFAULT_PORT : PORT = parseInt(argumentos[0]);
    console.log("Nuevo puerto de escucha del servidor:" + PORT);
}
//Se busca la ip del host
dns.lookup(os.hostname(), 4, function (err, address, family) {//4 para IPv4
    if (err) {
        console.log("Error al obtener la IP del servidor");
    } else {
        console.log('IP del servidor: ' + address.toString());
        //Se inicia el servidor una vez se ha buscado la ip
        app.listen(PORT, address.toString(), () => {
            console.log(`Servidor ejecutándose en http://${address}:${PORT}`);
        });
    }
});



