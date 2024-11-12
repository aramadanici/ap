const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const extractFieldName = (str) => str.split('__')[str.split('__').length - 1];

const populateHtmlTable = async (table, tableIdCounter) => {
    try {
        const url = table.dataset.url;
        const response = await axios.get(url);
        table.id += tableIdCounter;

        const data = response.data;
        const tableHeaders = Object.keys(data[0]);
        const tableHeadersHTML = tableHeaders.map(header => `<th>${capitalize(extractFieldName(header))}</th>`).join('');
        const tableBodyHTML = data.map(item => {
            const rowHTML = tableHeaders.map(header => `<td>${item[header]}</td>`).join('');
            return `<tr>${rowHTML}</tr>`;
        }).join('');

        table.querySelector('.table-headers').innerHTML = tableHeadersHTML;
        table.querySelector('.table-footer').innerHTML = tableHeadersHTML;
        table.querySelector('.table-body').innerHTML = tableBodyHTML;

        return table;
    } catch (error) {
        console.error(`Error populating html table: ${error}`);
    }
};

const initializeDataTable = (table) => {
    try {
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

// Does tables one after the other

// const initializeTables = async () => {
//     const tables = document.querySelectorAll('.table-general');
//     let tableIdCounter = 1;
//     for (const table of tables) {
//         const htmltable = await populateHtmlTable(table, tableIdCounter);
//         initializeDataTable(htmltable);
//         tableIdCounter++;
//     }
// };

// Does tables in parallel
const initializeTables = async () => {
    const tables = Array.from(document.querySelectorAll('.table-general'));
    const promises = tables.map(async (table, index) => {
        const htmltable = await populateHtmlTable(table, index + 1);
        initializeDataTable(htmltable);
    });
    await Promise.all(promises);
};

initializeTables();



// TODO: Create a class for the tables
// class Table {
//     constructor(element, id) {
//         this.element = element;
//         this.id = id;
//     }

//     async populate() {
//         // Code to populate the table
//     }

//     initialize() {
//         // Code to initialize a basic DataTable
//     }
// }

// class EditableTable extends Table {
//     initialize() {
//         // Code to initialize a DataTable with editing features
//     }
// }

// // Usage:
// const readOnlyTable = new Table(document.querySelector('#readonly-table'), 1);
// readOnlyTable.populate().then(() => readOnlyTable.initialize());

// const editableTable = new EditableTable(document.querySelector('#editable-table'), 2);
// editableTable.populate().then(() => editableTable.initialize());

// TODO: Rewrite using jQuery except for the axios request
// TODO: Minify the code