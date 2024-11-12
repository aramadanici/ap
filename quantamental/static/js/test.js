$(document).ready(function () {
    let table = $('.datatables-general').DataTable({
        select: true,
        responsive: true,
        searchPanes: {
            show: true,
            cascadePanes: true,
            threshold: 1,
            initCollapsed: true
        },
        dom: 'PBfrtip',
        pagingType: 'full_numbers',
        initComplete: function () {
            this.api()
                .columns()
                .every(function () {
                    let column = this;
                    let title = column.footer().textContent;

                    // Create input element
                    let input = document.createElement('input');
                    input.placeholder = title;
                    column.footer().replaceChildren(input);

                    // Event listener for user input
                    input.addEventListener('input', () => {
                        if (column.search() !== this.value) {
                            column.search(input.value).draw();
                        }
                    });
                });
        }
    });



    // Slider
    $(function () {
        const $slider = $("#slider-range");
        const min = parseInt($slider.data("min"));
        const max = parseInt($slider.data("max"));
        const initialValues = $slider.data("initial-values").split(',').map(Number);
        const filterColumn = parseInt($slider.data("column"));
        const minSpan = document.querySelector("#minSpan");
        const maxSpan = document.querySelector("#maxSpan");
        console.log(minSpan);


        $slider.slider({
            range: true,
            min: min,
            max: max,
            values: initialValues,
            animate: 'slow',
            slide: function (event, ui) {
                const [min, max] = ui.values;
                console.log(min, max);
                $("#amount").val(`${min} - ${max}`);

                $.fn.dataTable.ext.search.pop();
                $.fn.dataTable.ext.search.push((settings, data, dataIndex) => {
                    const columnValue = parseFloat(data[filterColumn]) || 0;
                    return ((isNaN(min) && isNaN(max)) ||
                        (isNaN(min) && columnValue <= max) ||
                        (min <= columnValue && isNaN(max)) ||
                        (min <= columnValue && columnValue <= max));
                });
                minSpan.innerText = min;
                maxSpan.innerText = max;

                // Redraw the DataTable
                $('.datatables-general').DataTable().draw();
            }
        });
    });
});