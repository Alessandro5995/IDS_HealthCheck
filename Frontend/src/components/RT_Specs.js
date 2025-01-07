function RT_Specs({rt_specs}) {
    return(
        <>
            <div className={"SO_resource_form"}>
                <div>
                    <h1>REAL TIME SPECS</h1>
                    <p >{rt_specs.cpu_rt}</p>
                </div>
            </div>
        </>
    )
}

export default RT_Specs;