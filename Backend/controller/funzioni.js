
const pcap = require("pcap");
const os = require("os");
const TelegramBot = require("node-telegram-bot-api");
let name = false;
const freeMemory = os.freemem();
const totalMemory = os.totalmem();

// Telegram Bot Singleton
let bot = null;
let name_telegram = false;
let chatId = null; // Aggiunto per memorizzare il chatId globale

// Funzione asincrona per ottenere le specifiche del sistema in tempo reale
async function specs_rt(ws) {
    const usedMemory = totalMemory - freeMemory; // Calcola la memoria usata
    const memoryUsage = (usedMemory / totalMemory) * 100; // Percentuale di memoria usata

    const cpus = os.cpus(); // Ottiene le informazioni sulle CPU (i core)
    let totalIdle = 0, totalTick = 0;

    /* os.cpus() restituisce un array di oggetti che rappresentano ciascun core della CPU.
       totalIdle e totalTick sono variabili che accumulano rispettivamente i tempi di inattività e i tempi totali di tutte le CPU.*/

    cpus.forEach(cpu => {
        for (type in cpu.times) {
            totalTick += cpu.times[type]; // Somma i tempi di tutte le attività della CPU
        }
        totalIdle += cpu.times.idle; // Somma i tempi di inattività della CPU
    });

    /*
Per ogni core della CPU, si itera attraverso i tipi di tempi (user, nice, sys, idle, irq) e si sommano tutti i tempi a totalTick.
Si sommano solo i tempi di inattività (idle) a totalIdle.
     */


    const idle = totalIdle / cpus.length; // Calcola il tempo medio di inattività
    const total = totalTick / cpus.length; // Calcola il tempo medio totale
    const cpuUsage = (1 - idle / total) * 100; // Percentuale di utilizzo della CPU
   // console.log("ho ricevuto la get");

    /*  idle è il tempo medio di inattività, calcolato dividendo totalIdle per il numero di core della CPU.
        total è il tempo medio totale, calcolato dividendo totalTick per il numero di core della CPU.
        cpuUsage è la percentuale di utilizzo della CPU, calcolata come 1 - (idle / total) e moltiplicata per 100.
*/


    const specs_rt_obj = {
        ram_rt: memoryUsage.toFixed(2) + '%', // Memoria usata in percentuale
        cpu_rt: cpuUsage.toFixed(2) + '%' // CPU usata in percentuale
    };

    ws.send(JSON.stringify(specs_rt_obj)); // Invia le specifiche al client
}

// Funzione per ottenere il bot di Telegram
function getTelegramBot() {
    if (!bot) {
        const token = process.env.TELEGRAM_BOT_TOKEN || '8006299723:AAFT3FheS6mz32vSO929f2K7gcmqHwrV91o';
        bot = new TelegramBot(token, { polling: true }); // Inizializza il bot di Telegram
        console.log("Telegram Bot initialized");
    }
    return bot;
}

// Funzione per inviare messaggi su Telegram
async function sendTelegramMessage(message) {
    const bot = getTelegramBot();

    if (chatId) {
        bot.sendMessage(chatId, message).catch(error => {
            console.error("Telegram message error:", error);
        });
    } else {
        console.error("Chat ID not set.");
    }
}

// Funzione per gestire i messaggi di Telegram
async function handleTelegramMessages() {
    const bot = getTelegramBot();

    bot.on('message', (msg) => {
        chatId = msg.chat.id;  // Ottiene l'ID della chat e lo memorizza globalmente
        const utente = msg.text;
        console.log('Chat ID:', chatId);
        console.log('Utente:', utente);

        // Invia un messaggio di conferma al mittente
        if(name_telegram) sendTelegramMessage("Ciao " + utente + " sono pronto a cominciare!");
        else {
            sendTelegramMessage(`Ciao Utente \nDimmi il tuo nome e inizia a monitorare con CMZ Sentinel`);
            name_telegram = true;
        }
    });
}

// Chiama handleTelegramMessages per iniziare ad ascoltare i messaggi di Telegram
handleTelegramMessages();

// Converte un buffer in un indirizzo IP
function bufferToIp(buffer) {
    return buffer.join('.');
}

// Controllo della RAM
function ram_checker(ws, ram_oggetto) {
    console.log("RAM CHECKER");
    const freeMemory = os.freemem()/1048576 // Ottiene la memoria libera e la converte in mb
    let ram_message = {};
    //se ram limit è non nullo E se la memoria libera è minore della soglia che abbiamo stabilito in ram limit allora dai l'allarme
    if (ram_oggetto.ram_limit && freeMemory < ram_oggetto.ram_limit) {
        ram_message = { message: "POCA RAM LIBERA, POSSIBILE RISCHIO DI CRASH! ⚠️" }
    } else {
        ram_message = { message: "Ram sufficiente disponibile ✅" }
    }
    ws.send(JSON.stringify(ram_message));  // Invia il messaggio al frontend

    if (ram_oggetto.telegram === true) {
        sendTelegramMessage(JSON.stringify(ram_message.message));   // Invia il messaggio su Telegram
    }
}

// Controllo della blacklist
function blacklist_checker(ws, arr_indirizzi, blacklist_oggetti) {
    console.log("BLACKLIST CHECKER");
    const blacklistMap = new Map(); //crea la struttura dati mappa

    blacklist_oggetti.forEach(item => {
       // console.error(typeof item.ip);
        blacklistMap.set(item.ip.toString(), item); // Popola la mappa con due coppie chiave-valore
        //come chiave --> SOLO il campo ip dell' oggetto che va nella blacklist,
        // come valore --> l'intero oggetto ip (composto da ip,flag,telegram)
    });

    const sentMessages = new Set(); // Usato per tenere traccia dei messaggi inviati
                                                 // il Set è una struttura che consente di memorizzare dati
                                                 // in un ordine casuale e senza valori ripetuti
    arr_indirizzi.forEach(el_captured => {
        const srcEntry = blacklistMap.get(el_captured.ip_src); //uso il metodo get proprio della strutttura dati
        const dstEntry = blacklistMap.get(el_captured.ip_dst);

       /* siamo passati da un O(n) a un O(1) */
        //se srcEntry è non nullo, il flag è S e il set non ha quell'ip quindi significa che non l'abbiam oancora messso e quindi controllato
        if (srcEntry && srcEntry.flag === "S" && !sentMessages.has(srcEntry.ip)) {
            console.error("-------->  ho trovato un S  <--------");
            const message = `${srcEntry.ip} --> Source`;
            console.info("STO PER INVIAREEEEEEEEEEEEEEEEEE " + message);
            ws.send(JSON.stringify({ message }));
            console.info("HO INVIATO " + message);

            if (srcEntry.telegram === true) sendTelegramMessage(message);

            sentMessages.add(srcEntry.ip); // Aggiungi il messaggio inviato all'insieme set per non farlo controllare più
        }

        if (dstEntry && dstEntry.flag === "D" && !sentMessages.has(dstEntry.ip)) {
            console.error("-------->  ho trovato un D  <--------");
            const message = `${dstEntry.ip} --> Destination`;
            ws.send(JSON.stringify({ message }));
            if (dstEntry.telegram === true) sendTelegramMessage(message);

            sentMessages.add(dstEntry.ip); // Aggiungi il messaggio inviato all'insieme per non farlo controllare più
        }
    });
}

// Cattura dei pacchetti
async function capture_packet(ws, blacklist_oggetti, callback) {
    const packets = [];
    const pcapSession = pcap.createSession('', 'tcp'); // Crea una sessione per catturare i pacchetti TCP

    /*
    device-->Questo parametro specifica l'interfaccia di rete da utilizzare per la cattura dei pacchetti.
             In questo caso '' lascia scegliere automaticamente

    options-->è un filtro. 'tcp' catturerà solo i pacchetti TCP.
     */

    pcapSession.on('packet', rawPacket => {
        try {
            const packet = pcap.decode.packet(rawPacket); // Decodifica il pacchetto
            const ipLayer = packet.payload.payload;  // --> il 1 payload è il livello ethernet, il 2 il livello ip

            /*
            rawPacket è il pacchetto di rete grezzo catturato.

pcap.decode.packet(rawPacket) utilizza la libreria pcap per decodificare il pacchetto grezzo in una struttura di dati più comprensibile.

Accesso al livello IP del pacchetto: javascript const ipLayer = packet.payload.payload;

packet.payload rappresenta il livello Ethernet del pacchetto.

packet.payload.payload rappresenta il livello IP del pacchetto, che è incapsulato all'interno del livello Ethernet.

             */

            // se iplayer è non nullo e così lo sono anche l'indirizzo di provenienza e  destinazione

            if (ipLayer && ipLayer.saddr && ipLayer.daddr) {
                packets.push({
                    ip_src: bufferToIp(ipLayer.saddr.addr), // Indirizzo IP sorgente
                    ip_dst: bufferToIp(ipLayer.daddr.addr), // Indirizzo IP destinazione
                });
            }
        } catch (error) {
            console.error("Packet decode error:", error);
        }
    });

    setTimeout(() => {
        console.log("Captured packets:", packets);
        blacklist_checker(ws, packets, blacklist_oggetti); // Controlla i pacchetti catturati con la blacklist
        if (callback) callback();           // se callback è vera, allora richiamala (richiama capture packet con il prossimo ip)
    }, 27000); // Tempo per catturare i pacchetti
}

// Variabili globali per gli intervalli
let interval = null;
let specsInterval = null;

// Funzione principale ricorsiva
function recursive_main(ws, blacklist_oggetti, ram_oggetto) {
    if (interval) {
        clearInterval(interval); // Cancella l'intervallo esistente prima di impostarne uno nuovo
        interval = null;
    }

    if (specsInterval) {
        clearInterval(specsInterval); // Cancella l'intervallo delle specifiche se esistente
        specsInterval = null;
    }

    // Funzione per processare gli IP nella blacklist
    const processIP = (index) => {
        if (index < blacklist_oggetti.length) {
            const ip_obj = blacklist_oggetti[index];
            console.log("Processing IP:", ip_obj.ip);
            capture_packet(ws, [ip_obj], () => {   //la callback che è passata come parametro a capture packet è questa
                index = index + 1;
                processIP(index); // Processa il prossimo IP
            });
        } else {
            console.log("Completed processing all IPs");
            if (ram_oggetto && ram_oggetto.ram_limit !== null) {
                ram_checker(ws, ram_oggetto); // Controlla la RAM
            }
        }
    };

    // Imposta un intervallo per il monitoraggio ricorsivo
    interval = setInterval(() => {
        console.log("Recursive Monitoring...");
        processIP(0); // Inizia a processare la lista degli IP dall'inizio
    }, 15000);

    // Timer per le specifiche in tempo reale
    specsInterval = setInterval(() => {
        specs_rt(ws); // Ottiene le specifiche in tempo reale
    }, 12000);

    return interval;
}

// Funzione per fermare il monitoraggio ricorsivo
function stop_recursive_main() {
    if (interval) {
        clearInterval(interval); // Cancella l'intervallo di monitoraggio
        interval = null;
        console.log("Recursive Monitoring stopped");
    }

    if (specsInterval) {
        clearInterval(specsInterval); // Cancella l'intervallo delle specifiche
        specsInterval = null;
        console.log("Specs Monitoring stopped");
    }
}


module.exports = { specs_rt, recursive_main, stop_recursive_main };