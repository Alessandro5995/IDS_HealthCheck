import Display_app from "./components/Display_app";
import SO_specs from "./components/SO_specs";
import SO_resource_form from "./components/SO_resource_form";
import Ip_src_form from "./components/Ip_src_form";
import { useEffect, useState } from "react";
import './AppContrastoElevato.css';
import './App.css';

function App() {
    const [specs_data, setSpecsData] = useState({ platform: "ricezione...", cpuModel: "ricezione...",arch: "ricezione...", total_ram: "ricezione..."});
    const [socketInstance, setSocketInstance] = useState(null);
    const [datiWebSocket, setDatiWebSocket] = useState([]);
    const [isHighContrast, setIsHighContrast] = useState(false);
    const [connection, setConnection] = useState(null);
    const [specs_rt, setSpecs_rt] = useState({ram_rt: "iniziare il monitoraggio di ip o ram per visualizzare", cpu_rt: "iniziare il monitoraggio di ip o ram per visualizzare"});

    useEffect(() => {
        console.log("sto per fare la get rt");

        // Creazione della connessione WebSocket
        const socket = new WebSocket('ws://localhost:3005');
        setSocketInstance(socket);

        socket.onopen = () => {
            console.log('Connessione WebSocket aperta');
            setConnection(true);
        };

        socket.onmessage = (event) => {
            console.log("ho ricevuto un evento");

            // Gestione dei messaggi in arrivo dal WebSocket
            try {
                const dati_json_web = JSON.parse(event.data);

                if ("close" in dati_json_web) {
                    socket.close();
                }

                console.log("Dati ricevuti dal WebSocket:", dati_json_web);
                if ("platform" in dati_json_web) {
                    setSpecsData(dati_json_web);
                }else if("cpu_rt" in dati_json_web) {
                    setSpecs_rt(dati_json_web);  // Recupero il valore del carico della CPU e ram
                }
            else {
                    setDatiWebSocket((prevState) => [...prevState, dati_json_web]);
                }

            } catch (error) {
                console.error('Errore nel parsing del JSON:', error);
            }
        };

        socket.onclose = () => {
            console.log('Connessione WebSocket chiusa');
            setConnection(false);
        };

        socket.onerror = (error) => {
            console.error('Errore WebSocket:', error);
            setConnection(false);
        };

        // pulizia dell'intervallo
        return () => {
            if (socketInstance) {
                socketInstance.close();
            }
        };

    }, []);

    function handleClickContrast() {
        setIsHighContrast(!isHighContrast);
        document.body.classList.toggle('high-contrast', !isHighContrast);
    }

    function handleTelegram() {
        console.log("ho fatto get");
    }

    function handleStop() {
        console.log("ho fatto Stop");
        if (socketInstance) {
            socketInstance.send(JSON.stringify({ stop: "true" }));
        }
    }

    const clearConsole = () => {
        setDatiWebSocket([]); // clearConsole per cancellare i messaggi dalla console a scelta
    };

    return (
        <div className={isHighContrast ? 'AppContrastoElevato' : 'App'}>
            <div class="section" style={{ display: "flex", flexDirection: "row" }}>
                <div style={{ width: "65%"}}>
                    <h1>Sentinel CMZ</h1>
                    <h2>- IDS & Health Check System -  La sicurezza non è un'opzione, è una priorità - </h2>
                    {connection && (
                    <h3 style={{color: "white", fontWeight: "bold"}}>
                        Stato Server:
                            <span style={{
                                width: "10px", 
                                height: "10px", 
                                backgroundColor: "green", 
                                borderRadius: "50%", 
                                display: "inline-block",
                                marginLeft: "5px",
                            }}>
                            </span>
                    </h3>
                    )}
                    {!connection && (
                    <h3 style={{color: "white", fontWeight: "bold"}}>
                        Stato Server:
                            <span style={{
                                width: "10px", 
                                height: "10px", 
                                backgroundColor: "red", 
                                borderRadius: "50%", 
                                display: "inline-block",
                                marginLeft: "5px",
                            }}>
                            </span>
                    </h3>
                    )}
                </div>
                <div style={{ alignContent: "center", justifyContent: "space-around", flexDirection: "row" }}>
                <input type="button" className="button" value={isHighContrast ? "Disabilita contrasto elevato" : "Attiva contrasto elevato"} onClick={handleClickContrast}/>
                    <a href="https://t.me/MandaMessbot" target="_blank">
                        <input type="button" class="button" value={"Telegram"} onClick={handleTelegram} />
                    </a>
                    <input type="button" class="button" value={"Stop"} onClick={handleStop} />
                </div>
            </div>
            <div style={{height: "100%", display: "flex", flexDirection: "row", width: "100%"}}>
                <div style={{width: "25%"}}>
                    <Ip_src_form socket={socketInstance} connection={connection} />
                </div>
                <div style={{width: "25%"}}>
                    <SO_resource_form socket={socketInstance} connection={connection} specs={specs_data} />
                </div>
                <div style={{width: "42%"}}>
                    <Display_app oggetto={datiWebSocket} clearConsole={clearConsole}/>
                </div>
                <div style={{width: "30%"}}>
                    <SO_specs specs={specs_data} specs_rt={specs_rt}/>

                </div>

            </div>
            <div class="rights" style={{borderBottom: "2px solid #4f8bf9"}}>
                <div>©2025 Sentinel CMZ. Tutti i diritti riservati </div>
            </div>
        </div>
    );
}

export default App;