/*
 * Servidor Node.JS para la práctica 2
 * ASIGNATURA: Servicios y Aplicaciones Telemáticas 
 * TITULACIÓN: Grado en Ingeniería de tecnologías de telecomunicación (14312020)
 * TITULACIÓN: Doble Grado Ing. de tecnologías de la telecomunicación e Ing. telemática (15212007)
 * TITULACIÓN: Grado en Ingeniería telemática (14512016)
 * CENTRO: ESCUELA POLITÉCNICA SUPERIOR (LINARES)
 * CURSO ACADÉMICO: 2019-2020
 * AUTOR: Juan Carlos Cuevas Martínez
 */
const http = require('http'); //Módulo de conexiones HTTP
const express = require('express'); //Módulo de express
const fs = require('fs'); //Módulo para la gestión de archivos.
const path = require('path'); //Módulo para manejar rutas de archivos
const os = require('os'); //Módulo de información relativa al sistema operativo y el host
const dns = require('dns'); //Módulo para emplear el servicio DNS
const {parse} = require('querystring'); //Módulo para la gestión y proceso de URLs


const MongoClient = require('mongodb').MongoClient; // Módulo de gestión MongoDB
const ObjectID = require('mongodb').ObjectID; // Modulo para poder emplear los objetos ID para referenciar documentos mongo


const app = express(); //Instancia de Express
const router = new express.Router(); //Encaminados Express para peticiones
app.use(router);
const url = "mongodb://localhost:27017/examenes"; //URL de la base de datos MongoDB


const DEFAULT_PORT = 8083; //Puerto del servidor por defecto
const PORT = DEFAULT_PORT; //Para poder actualizarla por los argumentos del programa.


//Ruta a los recursos estáticos, normalmente CSS o html sin personalizar
app.use(express.static(__dirname + '/public'));
/*
 * Para soportar CORS en todo tipo de métodos se filtran todas las peticiones y
 * se les añaden las cabeceras.
 * También se añade el soporte al método OPTIONS
 */
app.use((req, res, next) => {

    console.log("Petición entrante:" + req.method + " " + req.path);

    //Se guarda la petición en el fichero de log
    let instant = new Date(Date.now());
    let logEntry = instant.toLocaleString("es-Es") + ";" + req.connection.remoteAddress + ";" + req.method + ";" + req.url + "\n";
    fs.appendFile("log.txt", logEntry, (error) => {
        if (error) {
            console.log('\nError al añadir\nFin del registro'); //Se cierra la respuesta añadiendo el contenido como parámetro.
        } else {
            console.log('[LOG]+ ' + logEntry);
        }
    });
    
    //Configuración CORS
    res.header("Access-Control-Allow-Origin", "*"); //Se debe especificar para emplear CORS (Cross-Origin Resource Sharing)
    res.header("Access-Control-Allow-Headers", "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    res.header("Allow", "GET, POST, OPTIONS, PUT, DELETE");
    // authorized headers for preflight requests
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next(); //Cede el control a la siguiente parte de código que se ajuste con la petición.

    app.options('*', (req, res) => {
        console.log("Petición OPTIONS");
        // Métodos XHR permitidos  
        res.header('Access-Control-Allow-Methods', 'GET, PATCH, PUT, POST, DELETE, OPTIONS');
        res.send();
    });
});
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
        res.end(body);
    });
});

//Servicio para subir preguntas
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
                            db.close();
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


console.log(`Servidor Node.js 
Servicios y Aplicaciones Telemáticas.
Curso 2019/2020
--------------------------------------`);
//Nos quedamos con el primer parámetro de la líneas de comandos (que es el tercero. el primero el nombre del programa, el segundo la ruta
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



