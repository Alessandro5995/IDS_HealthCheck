const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { recursive_main, stop_recursive_main, getTotalCpuUsage, specs_rt } = require('./controller/funzioni');
const os = require("os");
const router = require("./routes/router1")
const app = express();
const port = 3001;
const wsPort = 3005;

app.use(cors()); // Abilita il middleware CORS per gestire le richieste cross-origin
app.use(router); // Usa il router definito in router1

app.use(express.json()); // Abilita il parsing del JSON nel corpo delle richieste
const server = http.createServer(app); // Crea un server HTTP con Express
const wss = new WebSocket.Server({ port: wsPort });       // Crea un server WebSocket data in input la porta sulla quale il server sarà in ascolto

const blacklist_oggetti = []; // Inizializza un vettore per gli oggetti che andranno in blacklist

// Connessione WebSocket
wss.on('connection', ws => {
    console.log('WebSocket Client Connected'); // Logga quando un client si connette

    // Invia le specifiche di sistema
    const cpu = os.cpus()[0];

    const specs = {
        platform: os.platform(),
        cpuModel: cpu.model,
        total_ram: os.totalmem(),
        arch: os.arch(),
    };

    ws.send(JSON.stringify(specs)); // Invia le specifiche di sistema al client
   // ws.send(JSON.stringify("prova")); // Invia un messaggio di prova

    ws.on('message', message => {
        let receivedObject;
        try {
            receivedObject = JSON.parse(message); // Tenta di parsare il messaggio come JSON
            console.log(receivedObject);
        } catch (error) {
            console.error("Invalid JSON received:", message); // Logga un errore se il JSON non è valido
            return;
        }

        /*
        VALUTIAMO CHE MESSAGGIO CONTIENE OGNI OGGETTO CHE GIUNGE DAL FRONTEND
        STOP --> FERMA LE RICORSIONI
        RAM --> INTRODUCE/AGGIORNA LA SOGLIA RAM CHE DEVE ESSERE LIBERA
        IP --> AGGIUNGE ALLA BLACKLIST UN IP CHE SARA' SOTTOPOSTO A CONTROLLI
         */

        if ("stop" in receivedObject) {  //se l'oggetto contiene il campo stop sarà un oggettto di stop
            console.error("CHIUSURA CONNESSIONE");
            ws.send(JSON.stringify({ close: "true" })); // Invia un messaggio di chiusura al client che stoppa il rendering
            ws.close(1000, "chiusura connessione"); // Chiude la connessione WebSocket   1000 --> è un codice di stato standard per la chiusura di una connessione WebSocket.
                                                    // Indica che la connessione è stata chiusa normalmente, senza errori. Questo codice è definito nello standard WebSocket
            stop_recursive_main();                  // Chiama la funzione per fermare la ricorsione
        } else {
            let ram_oggetto = null;
            if ("ram" in receivedObject) {
                console.log("RAM Threshold Received");
                ram_oggetto = {
                    ram_limit: receivedObject.ram,
                    telegram: receivedObject.telegram,
                };
            }

            if ("ip" in receivedObject) {
                blacklist_oggetti.push(receivedObject); // Aggiunge l'oggetto alla blacklist
                console.error("ULTIMO ELEMENTO AGGIUNTO: " + blacklist_oggetti.length + receivedObject.ip);
            }
            recursive_main(ws, blacklist_oggetti, ram_oggetto); // Chiama la funzione di monitoraggio
        }
    });

    ws.on('close', () => {
        console.log('Client Disconnected'); // Logga quando il client si disconnette
        stop_recursive_main(); // Ferma l'intervallo quando la connessione viene chiusa
    });
});

server.listen(port, () => {
    console.log(`Express server listening on port ${port}`);     // Logga quando il server Express è in ascolto
    console.log(`WebSocket server listening on port ${wsPort}`); // Logga quando il server WebSocket è in ascolto
});

module.exports = { app }; // Esporta l'app per l'uso in altri moduli