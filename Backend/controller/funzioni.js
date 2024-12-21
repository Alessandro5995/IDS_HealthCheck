
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

async function specs_rt(ws) {
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = (usedMemory / totalMemory) * 100;

    const cpus = os.cpus();
    let totalIdle = 0, totalTick = 0;

    cpus.forEach(cpu => {
        for (type in cpu.times) {
            totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const cpuUsage = (1 - idle / total) * 100;
    console.log("ho ricevuto la get");

    const specs_rt_obj = {
        ram_rt: memoryUsage.toFixed(2) + '%',
        cpu_rt: cpuUsage.toFixed(2) + '%'
    };

    ws.send(JSON.stringify(specs_rt_obj));
}

function getTelegramBot() {
    if (!bot) {
        const token = process.env.TELEGRAM_BOT_TOKEN || '8006299723:AAFT3FheS6mz32vSO929f2K7gcmqHwrV91o';
        bot = new TelegramBot(token, { polling: true });
        console.log("Telegram Bot initialized");
    }
    return bot;
}

// Send Telegram Messages
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

// Telegram Message Handling
async function handleTelegramMessages() {
    const bot = getTelegramBot();

    bot.on('message', (msg) => {
        chatId = msg.chat.id;  // Ottieni l'ID della chat e lo memorizza globalmente
        const utente = msg.text;
        console.log('Chat ID:', chatId);
        console.log('Utente:', utente);

        // Invia un messaggio di conferma al mittente
        if(name_telegram) sendTelegramMessage("Ciao "+ utente+" sono pronto a cominciare!");
        else{
            sendTelegramMessage(`Ciao Utente \nDimmi il tuo nome e inizia a monitorare con CMZ Sentinel`);
            name_telegram=true;
        }

    });
}

// Call handleTelegramMessages to start listening to Telegram messages
handleTelegramMessages();

// Convert buffer to IP
function bufferToIp(buffer) {
    return buffer.join('.');
}

// RAM Checker
function ram_checker(ws, ram_oggetto) {
    console.log("RAM CHECKER");
    const freeMemory = os.freemem();
    let ram_message = {};
    if (ram_oggetto.ram_limit && freeMemory < ram_oggetto.ram_limit) {
        ram_message = { message: "POCA RAM LIBERA, POSSIBILE RISCHIO DI CRASH! ⚠️" }
    } else {
        ram_message = { message: "Ram sufficiente disponibile ✅" }
    }
    ws.send(JSON.stringify(ram_message));  // Il frontend gestisce ram_message.message

    if (ram_oggetto.telegram === true) {
        sendTelegramMessage(JSON.stringify(ram_message.message));   // Noi gestiamo il messaggio Telegram
    }
}

// Blacklist Checker
 function blacklist_checker(ws, arr_indirizzi, blacklist_oggetti) {
    console.log("BLACKLIST CHECKER");
    const blacklistMap = new Map();

    blacklist_oggetti.forEach(item => {
        console.error(typeof item.ip);
        blacklistMap.set(item.ip.toString(), item); // Popolo la mappa con due coppie chiave-valore
    });

    const sentMessages = new Set(); // Usato per tenere traccia dei messaggi inviati

    arr_indirizzi.forEach(el_captured => {
        const srcEntry = blacklistMap.get(el_captured.ip_src);
        const dstEntry = blacklistMap.get(el_captured.ip_dst);

        if (srcEntry && srcEntry.flag === "S" && !sentMessages.has(srcEntry.ip)) {
            console.error("-------->  ho trovato un S  <--------");
            const message = `${srcEntry.ip} --> Source`;
            console.info("STO PER INVIAREEEEEEEEEEEEEEEEEE " + message);
            ws.send(JSON.stringify({ message }));
            console.info("HO INVIATO " + message);

            if (srcEntry.telegram === true) sendTelegramMessage(message);

            sentMessages.add(srcEntry.ip); // Aggiungi il messaggio inviato all'insieme
        }

        if (dstEntry && dstEntry.flag === "D" && !sentMessages.has(dstEntry.ip)) {
            console.error("-------->  ho trovato un D  <--------");
            const message = `${dstEntry.ip} --> Destination`;
            ws.send(JSON.stringify({ message }));
            if (dstEntry.telegram === true) sendTelegramMessage(message);

            sentMessages.add(dstEntry.ip); // Aggiungi il messaggio inviato all'insieme
        }
    });
}

// Packet Capture
async function capture_packet(ws, blacklist_oggetti, callback) {
    const packets = [];
    const pcapSession = pcap.createSession('', 'tcp');

    pcapSession.on('packet', rawPacket => {
        try {
            const packet = pcap.decode.packet(rawPacket);
            const ipLayer = packet.payload.payload;

            if (ipLayer && ipLayer.saddr && ipLayer.daddr) {
                packets.push({
                    ip_src: bufferToIp(ipLayer.saddr.addr),
                    ip_dst: bufferToIp(ipLayer.daddr.addr),
                });
            }
        } catch (error) {
            console.error("Packet decode error:", error);
        }
    });

    setTimeout(() => {
        console.log("Captured packets:", packets);
        blacklist_checker(ws, packets, blacklist_oggetti);
        if (callback) callback();
    }, 27000); // Allow time for capturing packets
}

// Variabili globali per gli intervalli
let interval = null;
let specsInterval = null;

function recursive_main(ws, blacklist_oggetti, ram_oggetto) {
    if (interval) {
        clearInterval(interval); // Cancella l'intervallo esistente prima di impostarne uno nuovo
        interval = null;
    }

    if (specsInterval) {
        clearInterval(specsInterval); // Cancella l'intervallo delle specifiche se esistente
        specsInterval = null;
    }



    const processIP = (index) => {
        if (index < blacklist_oggetti.length) {
            const ip_obj = blacklist_oggetti[index];
            console.log("Processing IP:", ip_obj.ip);
            capture_packet(ws, [ip_obj], () => {
                index = index + 1;
                processIP(index); // Processa il prossimo IP
            });
        } else {
            console.log("Completed processing all IPs");
            if (ram_oggetto && ram_oggetto.ram_limit !== null) {
                ram_checker(ws, ram_oggetto);
            }
        }
    };

    interval = setInterval(() => {
        console.log("Recursive Monitoring...");
        processIP(0); // Inizia a processare la lista degli IP dall'inizio
    }, 15000);

    // Timer per le specifiche in tempo reale
    specsInterval = setInterval(() => {
        specs_rt(ws);
    }, 12000);


    return interval;
}

function stop_recursive_main() {
    if (interval) {
        clearInterval(interval);
        interval = null;
        console.log("Recursive Monitoring stopped");
    }

    if (specsInterval) {
        clearInterval(specsInterval);
        specsInterval = null;
        console.log("Specs Monitoring stopped");
    }
}

module.exports = { specs_rt, recursive_main, stop_recursive_main };