import '../css/SO_specs.css';

function SO_specs({ specs, specs_rt }) {
    return (
        <div className="SO_specs">
            <label>
                <h3 className="specs-title">Statistiche piattaforma:</h3>
            </label>

            <div className="specs-item">
                <p>• <span className="specs-key">Stai usando:</span> {specs.platform}</p>
                <p>• <span className="specs-key">Architettura:</span> {specs.arch}</p>
                <p>• <span className="specs-key">CPU:</span> {specs.cpuModel}</p>
                <p>• <span className="specs-key">Memoria RAM totale:</span> {(specs.total_ram / Math.pow(1024, 3)).toFixed(2)} GB</p>
            </div>

            <h3 className="specs-title">Carico PC:</h3>            
            {specs_rt !== null && (
                <div className="specs-item">
                    <p>• <span className="specs-key">Carico CPU:</span> {specs_rt.cpu_rt}</p>
                    <p>• <span className="specs-key">Carico RAM:</span> {specs_rt.ram_rt}</p>
                </div>
            )}
        </div>
    );
}

export default SO_specs;
