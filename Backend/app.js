const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { recursive_main, stop_recursive_main, getTotalCpuUsage, specs_rt} = require('./controller/funzioni');
const os = require("os");
const router = require("./routes/router1")
const app = express();
const port = 3001;
const wsPort = 3005;

app.use(cors());
app.use(router);

app.use(express.json());
const server = http.createServer(app);
const wss = new WebSocket.Server({ port: wsPort });

const blacklist_oggetti = [];

// WebSocket Connection
wss.on('connection', ws => {
    console.log('WebSocket Client Connected');

    // Send system specs
    const cpu = os.cpus()[0];

    const specs = {
        platform: os.platform(),
        cpuModel: cpu.model,
        total_ram: os.totalmem(),
        arch: os.arch(),
    };

    ws.send(JSON.stringify(specs));
    ws.send(JSON.stringify("prova"));

    ws.on('message', message => {
        let receivedObject;
        try {
            receivedObject = JSON.parse(message);
            console.log(receivedObject);
        } catch (error) {
            console.error("Invalid JSON received:", message);
            return;
        }

        if ("stop" in receivedObject) {
            console.error("CHIUSURA CONNESSIONE");
            ws.send(JSON.stringify({ close: "true" }));
            ws.close(1000, "chiusura connessione");
            stop_recursive_main(); // Chiama la funzione per fermare l'intervallo
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
                blacklist_oggetti.push(receivedObject);
                console.error("ULTIMO ELEMENTO AGGIUNTO: " + blacklist_oggetti.length + receivedObject.ip);
            }
            recursive_main(ws, blacklist_oggetti, ram_oggetto); // Chiama la funzione di monitoraggio
        }
    });

    ws.on('close', () => {
        console.log('Client Disconnected');
        stop_recursive_main(); // Ferma l'intervallo quando la connessione viene chiusa
    });
});

server.listen(port, () => {
    console.log(`Express server listening on port ${port}`);
    console.log(`WebSocket server listening on port ${wsPort}`);
});

module.exports = { app };
