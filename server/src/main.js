async function get_client_id() {
    const id = await (await fetch("client_id")).text()
    document.getElementById("button_resp_txt").innerHTML = id
}
