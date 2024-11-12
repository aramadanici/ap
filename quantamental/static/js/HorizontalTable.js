class HorizontalTable {

    constructor(_tableid, _data, _dynamic = false) {
        this.tableid = _tableid;
        this.table = document.getElementById(_tableid);
        this.data = _data;
        this.dynamic = _dynamic;

        this.initTable();
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    extractFieldName(str) {
        return str.split('__')[str.split('__').length - 1];
    }

    splitString(str) {
        // Split the string by capital letters
        const words = str.split(/(?=[A-Z])/);
        // Join the words with a space
        const result = words.join(' ');
        return result;
    }


    initStaticTable() {
        try {
            const table = this.table;
            const data = this.data;

            const tableHeaders = Object.keys(data[0]);
            const tableHeadersHTML = tableHeaders.map(header => `<th>${this.splitString(capitalize(extractFieldName(header)))}</th>`).join('');
            const tableBodyHTML = data.map(item => {
                const rowHTML = tableHeaders.map(header => {
                    let formattedValue = item[header];
                    // Round numbers to 2 decimal places
                    if (!isNaN(formattedValue) && Number.isFinite(formattedValue)) {
                        formattedValue = Math.round(formattedValue * 100) / 100;
                        // Add "M" for millions and "B" for billions
                        if (Math.abs(formattedValue) >= 1e6 && Math.abs(formattedValue) < 1e9) {
                            formattedValue = (formattedValue / 1e6).toFixed(2) + "M";
                        } else if (Math.abs(formattedValue) >= 1e9) {
                            formattedValue = (formattedValue / 1e9).toFixed(2) + "B";
                        }
                    }
                    // Add thousand separators
                    formattedValue = formattedValue.toLocaleString();
                    return `<td>${formattedValue}</td>`;
                }).join('');
                return `<tr>${rowHTML}</tr>`;
            }).join('');

            table.querySelector('.table-headers').innerHTML = tableHeadersHTML;
            table.querySelector('.table-body').innerHTML = tableBodyHTML;
            const footerElement = table.querySelector('.table-footer');
            if (footerElement) {
                table.querySelector('.table-footer').innerHTML = tableHeadersHTML;
            }

            return table;
        } catch (error) {
            console.error(`Error populating html table: ${error}`);
        }
    };


    initDynamicTable() {
        try {
            const table = this.table;
            $(table).DataTable({
                stateSave: true,
                select: true,
                pagingType: 'first_last_numbers',
                dom: 'PBfrtip',
                responsive: true,
                colReorder: true,
                keys: false,
                searchPanes: {
                    cascadePanes: true,
                    initCollapsed: true,
                },
                buttons: [
                    { extend: 'createState' },
                    { extend: 'savedStates' },
                    { extend: 'colvis', text: 'Column Visibility' },
                    { extend: 'copy' },
                    { extend: 'csv' },
                    { extend: 'excel' },
                    { extend: 'pdf', orientation: 'landscape' },
                    { extend: 'print' },
                ],
                initComplete: function () {
                    this.api()
                        .columns()
                        .every(function () {
                            let column = this;
                            let title = column.footer().textContent;
                            let input = document.createElement('input');
                            input.placeholder = title;
                            column.footer().replaceChildren(input);
                            input.addEventListener('input', () => {
                                if (column.search() !== input.value) {
                                    column.search(input.value).draw();
                                }
                            });
                        });
                }
            });
        } catch (error) {
            console.error(`Error initializing DataTable: ${error}`);
        }
    };

    initTable() {
        this.initStaticTable()

        if (this.dynamic) {
            this.initDynamicTable()
        }
    }
}