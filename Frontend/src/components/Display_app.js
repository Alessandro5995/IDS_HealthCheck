import '../css/Display_app.css';

function Display_app({ oggetto , clearConsole}) {
    return (
        <div className="Display_app">
            <div className="header">
                <center><label className="label_style">Console di controllo:</label></center>
                <button className="clear-button" onClick={clearConsole}>Pulisci</button>
            </div>
            <div className="console-content">
                {oggetto.map((item, index) => (
                    <p className="message" key={index}>{item.message}</p>
                ))}
            </div>
        </div>
    );
}

export default Display_app;
