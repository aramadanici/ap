let horTable

axios.get(tableData).then(response => {
    const data = response.data;
    console.log(data)
    horTable = new HorizontalTable(_tableid = "test_table", _data = data, _dynamic = true);
}).catch(error => {
    console.error('Error fetching data:', error);
});


axios.get(tableData2).then(response => {
    const data = response.data;
    horTable = new HorizontalTable(_tableid = "test_table_2", _data = data, _dynamic = true);
}).catch(error => {
    console.error('Error fetching data:', error);
});
