import '../css/Ip_src_form.css'
import {useState} from "react";
import {isIPv4} from 'is-ip';
import axios from "axios";

function Ip_src_form({socket,connection}){

    const [formData,setFormData]=useState({})
    const [posteseguita,setPostEseguita]=useState(false)
    const [errorMessage, setErrorMessage] = useState('');
    const[telegram_notifica,setTelegramNotifica] = useState(false);

    function handleChange(event){
        const {type,name,value,checked} = event.target;

        let newVal;
        if(type==="checkbox"){
            newVal=checked;
        }else{
            newVal=value;
        }

        setFormData((prevData)=>{
            return {...prevData,[name]:newVal}
        })

    }

    function handleSubmit(e){
        e.preventDefault();
        setPostEseguita(true);
        setErrorMessage('');

        if (!isIPv4(formData.ip)){ // controllo se l'indirizzo IP è effettivamente di tipo 4 (IPv4)
            setErrorMessage('L\'IP inserito non è valido.'); 
            setPostEseguita(false);  // Annulla l'invio
            return;
        }

        const ip_src_form_object ={
            ip:formData.ip,
            telegram:formData.telegram,
            flag:formData.flags
        }

        //faccio una post per dire l'ip da aggiungere alla bkack list e se voglio la notifica su telegream

        if (socket && socket.readyState === WebSocket.OPEN) {

            // Puoi anche inviare i dati del form se necessario
            socket.send(JSON.stringify(ip_src_form_object));
            console.error("HO INVIATO i dati del form src")
          //  socket.send(JSON.stringify({ message: "start-ip-checker" }));
            console.error("HO INVIATO il comando di partire")
        } else {
            console.error('WebSocket non è aperto');
        }
    }


   return(
    <div className={"Ip_src_form"}>
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px"}}>
        <h4 class="ip_checker_title">Controllo IP:</h4>
        <p>• <span className="ip_key">IP da trovare:</span></p>
        <input type="text" name="ip" onChange={handleChange} placeholder="Indirizzo IP" />
        {errorMessage && (
            <p style={{ color: "red", fontSize: "14px", fontWeight: "600" }}>
                {errorMessage}
            </p>
        )}
        <p>• <span className="ip_key">Invio notifica su Telegram:</span></p>
        <label className={"toggle_switch"}>
            <input type="checkbox" name="telegram" onChange={handleChange} />
            <span className="slider"></span>
        </label>
        <p>• <span className="ip_key">Seleziona opzione (S/D):</span></p>
        <select name="flags" onChange={handleChange}>
            <option value="" align="center" disabled={true} >Seleziona provenienza </option>
            <option value="S">Sorgente</option>
            <option value="D">Destinazione</option>
        </select>
        <input type="submit" value="Invia" />
    </form>
    {(posteseguita&&connection) &&(
        <p align="center" style={{ marginTop: "15px", color: "green", fontWeight: "600", fontSize: "16px" }}>
            Inviato correttamente!
        </p>
    )}
    </div>  
   )
}

export default Ip_src_form;