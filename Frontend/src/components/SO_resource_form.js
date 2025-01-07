import "../css/SO_resource_form.css";
import { useState } from "react";

function SO_resource_form({ socket, connection, specs }) {
    const [formData, setFormData] = useState({});
    const [posteseguita, setPostEseguita] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const ram_tot=(specs.total_ram / Math.pow(1024, 3)); // valore della ram totale da mettere a confronto con la soglia di ram inserita dall'utente

    function handleChange(event) {
        const { type, name, value, checked } = event.target;

        let newVal;
        if (type === "checkbox") {
            newVal = checked;
        } else {
            newVal = value;
        }

        setFormData((prevState) => {
            return {
                ...prevState,
                [name]: newVal,
            };
        });
    }

    function handleSubmit(e) {
        e.preventDefault();
        setPostEseguita(false);
        setErrorMessage(""); // nel caso in cui il valore sia corretto non mostra nessun errore
        
        // controlla se il valore della ram è valido, in base al tipo e al valore e se è effettivamente un numero
        if (isNaN(formData.soglia_ram) || formData.soglia_ram === '') {  // controllo anche gli spazi bianchi, poiché vengono considerati caratteri
            setErrorMessage("Il valore della RAM inserito non è valido, inserire valore corretto.");
            return;  // Non invia niente se il valore della ram non è un numero o è vuoto
        }

        // controlla se il valore della ram è diverso da zero
        if (formData.soglia_ram==0) {
            setErrorMessage("Il valore inserito della RAM non può essere zero, inserire valore corretto.");
            return;  // Non invia niente se il valore della ram è zero
        }

        // controlla se il valore della ram da controllare è inferiore alla ram totale del sistema
        if (formData.soglia_ram > ram_tot){
            setErrorMessage("il valore inserito della RAM non può essere maggiore della RAM totale del sistema.");
            return;
        }

        const so_resource_form_object = {
            ram: formData.soglia_ram,
            telegram: formData.telegram,
        };

        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(so_resource_form_object));
            console.error("HO INVIATO i dati del form resource");
            setPostEseguita(true); // solo se non ci sono errori vengono inviati i dati
        } else {
            console.error("WebSocket non è aperto");
        }
    }

    return (
        <div className={"SO_resource_form"}>
            <form style={{ display: "flex", flexDirection: "column" }} onSubmit={handleSubmit}>
                <label className="so_resources_title">
                    <h4>Controllo RAM: </h4>
                </label>
                <div className={"so_resource_key"} style={{ display: "flex", flexDirection: "column" }}>
                    <h4>• Inserisci la soglia di RAM da non superare (in GB) :</h4>
                    <div style={{ display: "flex", flexDirection: "row" }}>
                        <input type="text" name="soglia_ram" placeholder="Valore RAM" onChange={handleChange} />
                    </div>
                </div>
                {errorMessage && (
                    <p style={{ color: "red", fontSize: "14px", fontWeight: "600" }}>
                        {errorMessage}
                    </p>
                )}
                <label className={"so_resource_key"} style={{ marginTop: "20px", marginBottom: "15px" }}>• Invio notifica su Telegram:</label>
                <label className={"toggle_switch"}>
                    <input type="checkbox" name="telegram" onChange={handleChange} />
                    <span className="slider"></span>
                </label>
                <input type="submit" name="submit" />
            </form>
            {(posteseguita && connection) && (
                <p align="center" style={{ marginTop: "15px", color: "green", fontWeight: "bold", fontSize: "17px" }}>
                    Inviato correttamente!
                </p>
            )}
        </div>
    );
}

export default SO_resource_form;
