/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *@description Scrip que crea el informe de gastos en la subtab informes/informe de gastos
 */
define(['N/ui/serverWidget', 'N/search'], function(ui, search) {

    function onRequest(context) {
    
        try {
            var dataInfGtos = [];
            var validaId = []
             // SE hace una busqueda para cargar la información de 
            var resultFilter = search.create({
                type : search.Type.EXPENSE_REPORT,
                columns: [
                    {name: 'trandate'},
                    {name: 'tranid'},
                    {name: 'entity'},
                    {name: 'account'},
                    {name: 'status'},
                    {name: 'memo'},
                    {name: 'total'},
                ]
            });  

            var resultData = resultFilter.run();
            
            var start = 0;
           
            if(resultData != null){
                do{
                    var resultSet = resultData.getRange(start, start + 1000);
                        for (var t = 0; t < resultSet.length; t++) {
                            var id = resultSet[t].id;
                            var fecha = resultSet[t].getValue({name: 'trandate'});
                            var numeroDocumento = resultSet[t].getValue({name: 'tranid'});
                            var nombre = resultSet[t].getText({name: 'entity'});
                            var cuenta = resultSet[t].getText({name: 'account'});
                            var estatus = resultSet[t].getText({name: 'status'});
                            var nota = resultSet[t].getValue({name: 'memo'});
                            var importe = resultSet[t].getValue({name: 'total'});
                            
                            if(validaId.indexOf(id) == -1){
                                validaId.push(id);
                                dataInfGtos.push({
                                    id: id,
                                    fecha: fecha,
                                    numeroDocumento: numeroDocumento,
                                    nombre :nombre,
                                    cuenta :cuenta,
                                    estatus :estatus,
                                    nota :nota,
                                    importe :importe,
                                });    
                            }
                        }   
                        start += 1000;  
                }while(resultSet && resultSet.length == 1000)
            }  
            log.audit({title: 'dataInfGtos', details: dataInfGtos});
            log.audit("METHOD", "METYHOS ID "+context.request.method)
            if(context.request.method == 'GET'){

                var form = ui.createForm({
                    title: 'INFORME DE GASTOS'
                });

                var sublist = form.addSublist({
                    id : 'custpage_sublist',
                    type : ui.SublistType.LIST,
                    label : 'INFORME DE GASTOS'
                });
                    
                    sublist.addField({
                        id : 'custpage_fecha',
                        type : ui.FieldType.TEXT,
                        label : 'Fecha'
                    });

                    sublist.addField({
                        id : 'custpage_num_documento',
                        type : ui.FieldType.TEXT,
                        label : 'Número de documento'
                    });

                    sublist.addField({
                        id : 'custpage_empleado',
                        type : ui.FieldType.TEXT,
                        label : 'Empleado'
                    });

                    sublist.addField({
                        id : 'custpage_edo_actual',
                        type : ui.FieldType.TEXT,
                        label : 'Estado Actual'
                    });

                    sublist.addField({
                        id : 'custpage_cuenta',
                        type : ui.FieldType.TEXT,
                        label : 'Cuenta'
                    });

                    sublist.addField({
                        id : 'custpage_nota',
                        type : ui.FieldType.TEXT,
                        label : 'Nota'
                    });
                    
                    sublist.addField({
                        id : 'custpage_importe',
                        type : ui.FieldType.TEXT,
                        label : 'Importe'
                    });
                
                    for(var j = 0; j < dataInfGtos.length; j++){

                        sublist.setSublistValue({
                            id : 'custpage_fecha',
                            line : j,
                            value : dataInfGtos[j].fecha || "-"
                        });
                        sublist.setSublistValue({
                            id : 'custpage_num_documento',
                            line : j,
                            value : dataInfGtos[j].numeroDocumento || "-"
                        });

                        sublist.setSublistValue({
                            id : 'custpage_empleado',
                            line : j,
                            value : dataInfGtos[j].nombre || "-"
                        });

                        sublist.setSublistValue({
                            id : 'custpage_edo_actual',
                            line : j,
                            value : dataInfGtos[j].estatus || "-"
                        });

                        sublist.setSublistValue({
                            id : 'custpage_cuenta',
                            line : j,
                            value : dataInfGtos[j].cuenta || "-"
                        });
                        log.audit("Loop posicion 5", "Loop posicion 5")

                        sublist.setSublistValue({
                            id : 'custpage_nota',
                            line : j,
                            value : dataInfGtos[j].nota || "-"
                        });
                        sublist.setSublistValue({
                            id : 'custpage_importe',
                            line : j,
                            value : dataInfGtos[j].importe || "-"
                        });
                    }
                context.response.writePage(form);
            }
            
        } catch (error) {
            log.audit({title: 'Error al generar información de reporte', details: context});
        }
        
    }

    return {
        onRequest: onRequest
    }
});
