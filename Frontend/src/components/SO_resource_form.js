import "../css/SO_resource_form.css";
import { useState } from "react";

function SO_resource_form({ socket,connection}) {
    const [formData, setFormData] = useState({});
    const [posteseguita, setPostEseguita] = useState(false);

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
        setPostEseguita(true);

        const so_resource_form_object = {
            ram: formData.soglia_ram,
            telegram: formData.telegram,
        };

        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(so_resource_form_object));
            console.error("HO INVIATO i dati del form resource");
        } else {
            console.error("WebSocket non è aperto");
        }
    }

    return (
        <div className={"SO_resource_form"}>
            <form style={{ display: "flex", flexDirection: "column" }} onSubmit={handleSubmit}>
                <label class="so_resources_title">
                    <h4>Controllo RAM: </h4>
                </label>
                <div className={"so_resource_key"} style={{ display: "flex", flexDirection: "column" }}>
                    <h4>• Inserisci la soglia di RAM da non superare:</h4>
                    <div style={{ display: "flex", flexDirection: "row" }}>
                        <input type="text" name="soglia_ram" placeholder="Valore RAM" onChange={handleChange} />
                    </div>
                </div>
                <label className={"so_resource_key"} style={{ marginTop: "20px", marginBottom: "15px"  }}>• Invio notifica su Telegram:</label>
                <label className={"toggle_switch"}>
                    <input type="checkbox" name="telegram" onChange={handleChange} />
                    <span className="slider"></span>
                </label>
                <input type="submit" name="submit"/>
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
