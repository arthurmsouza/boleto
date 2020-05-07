function if_pgto(){
    document.getElementById('consulta').style = 'display: none';
    document.getElementById('pagamento').style = 'display: block';
}

function if_ledger(){
    document.getElementById('consulta').style = 'display: block';
    document.getElementById('pagamento').style = 'display: none';
}
function cip_ledger(){
    document.getElementById('ledger').style = 'display: block';
    document.getElementById('blockchain').style = 'display: none';
}
function cip_bc(){
    document.getElementById('blockchain').style = 'display: block';
    document.getElementById('ledger').style = 'display: none';
}
