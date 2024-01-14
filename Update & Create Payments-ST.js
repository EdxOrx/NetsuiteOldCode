    /**
     *@NApiVersion 2.x
    *@NScriptType Suitelet
    */
    // cambiar el management fee por la bandera en true de revenue recognition.
    // nombre, titulo, periodo, 
    // 
    define(['N/ui/serverWidget', 'N/search', 'N/log', 'N/redirect', 'N/record', 'N/runtime', "N/format"], function(ui, search, log, redirect, record, runtime, format) {

        function onRequest(context) {
            try {
                if(context.request.method == 'GET'){
                    var sessionObj = runtime.getCurrentSession();
                    var data = sessionObj.get({name: "custscript_wwf_data_revenue"});
                    // var data = context.request.parameters.custparam_data;
                    if(data){
                        data = JSON.parse(data);
                        log.audit({title: 'data', details: data}); 
                    }
                    
                    var form = ui.createForm({
                        title: 'Valores de Revenue Recognition'
                    });
                    
                    createSublist(form, data);

                    var mangementEjecutado = sessionObj.get({
                        name: "custscript_wwf_mg_managementrr"
                    })

                    var valoresNegativos = sessionObj.get({
                        name: "custscript_wwf_mg_valoresnegativos"
                    })


                    if(mangementEjecutado == "true" && valoresNegativos == "false"){
                        form.addSubmitButton({label: 'Crear Facturas'});
                    }else{
                        if(valoresNegativos == "true"){
                            var field = form.addField({
                                id : 'custpage_text_valneg',
                                type : ui.FieldType.LABEL,
                                label : 'No se pueden crear las facturas porque hay valores negativos'
                            });
                        }
                        if(mangementEjecutado == "false"){
                            var field = form.addField({
                                id : 'custpage_text_ccmf',
                                type : ui.FieldType.LABEL,
                                label : 'Primero se tiene que ejecutar el common cost y despues el management fee para ejecutar el revenue recognition'
                            });
                        }
                    }
    



                    
                    form.addResetButton({label: 'Limpiar Campos'});

                    context.response.writePage(form);
                }else{
                    var dataInvoice = [];
                    var currentRecord = context.request;
                    var numLinesArchivoSalida = currentRecord.getLineCount({ group: 'custpage_sublist' });

                   

                    for(var i = 0; i < numLinesArchivoSalida; i++){
                    
                        var memo = currentRecord.getSublistValue({group: 'custpage_sublist', name: 'custpage_memo', line: i});
                        var importe = currentRecord.getSublistValue({group: 'custpage_sublist', name: 'custpage_importe', line: i});
                        var idGrant = currentRecord.getSublistValue({group: 'custpage_sublist', name: 'custpage_idgrant', line: i});
                        var idStructure = currentRecord.getSublistValue({group: 'custpage_sublist', name: 'custpage_idstructure', line: i});
                        var idSubsidiaria = currentRecord.getSublistValue({group: 'custpage_sublist', name: 'custpage_subsidiary_id', line: i});
                        var idDonante = currentRecord.getSublistValue({group: 'custpage_sublist', name: 'custpage_donante_id', line: i});
                        var idLocation = currentRecord.getSublistValue({group: 'custpage_sublist', name: 'custpage_location_id', line: i});
                        var periodo = currentRecord.getSublistValue({group: 'custpage_sublist', name: 'custpage_periodo_id', line: i});
                        
                        if(parseFloat(idStructure) == 0.0){
                            idStructure = ""; 
                        }
                        if(parseFloat(periodo)){
                            periodo = parseInt(periodo); 
                        }

                        dataInvoice.push({
                            memo: memo,
                            importe: importe,
                            idGrant: idGrant,
                            idSubsidiaria: idSubsidiaria,
                            idDonante: idDonante,
                            idLocation: idLocation,
                            periodo: periodo,
                            idStructure:idStructure
                        });
                    }
                    log.audit({ title: 'dataInvoice',  details: dataInvoice});
                    createInvoice(dataInvoice);
                    context.response.write('Se han creado las facturas de Revenue Recognition');
                }
            } catch (error) {
                log.audit({title: 'Error al generar las facturas', details: error});   
            }
        }

        function createInvoice(dataInvoice){
            try {

                var itemCrearFactura = record.load({
                    type: "customrecord_wwf_mg_item_revenue",
                    id: 1,
                    isDynamic: true
                });

                var idItem = itemCrearFactura.getValue({fieldId:"custrecordwwf_mg_id_item_revenue"})

                for(var i = 0; i < dataInvoice.length; i++){
                    
                    var invoice = record.create({
                        type: record.Type.INVOICE,
                        isDynamic: true
                    });

                    
                    
                    invoice.setValue({fieldId: 'entity', value: dataInvoice[i].idDonante })
                    invoice.setValue({fieldId: 'subsidiary', value: dataInvoice[i].idSubsidiaria })
                    invoice.setValue({fieldId: 'postingperiod', value: dataInvoice[i].periodo })
                    invoice.setValue({fieldId: 'location', value: dataInvoice[i].idLocation })
                    invoice.setValue({fieldId: 'cseg_npo_grant_segm', value: dataInvoice[i].idGrant })
                    invoice.setValue({fieldId: 'cseg_npo_fund_p', value: dataInvoice[i].idStructure })
                    invoice.setValue({fieldId: 'tobeemailed', value: false })
                    invoice.setValue({fieldId: 'customform', value: '167'})

                    invoice.selectNewLine({sublistId: 'item'});
                    invoice.setCurrentSublistValue({sublistId:'item', fieldId:'item', value: idItem, line: 0});
                    invoice.setCurrentSublistValue({sublistId:'item', fieldId:'amount', value: dataInvoice[i].importe, line: 0});
                    invoice.setCurrentSublistValue({sublistId:'item', fieldId:'taxcode', value: 189, line: 0});
                    invoice.commitLine({ sublistId: 'item'});

                    invoice.setValue({fieldId: 'postingperiod', value: dataInvoice[i].periodo })
                    var periodoText =  invoice.getText({fieldId: "postingperiod"});

                    
                    var mes = periodoText.split(" ")[0];

                    switch(mes){
                        case "ene":
                                mes = 1;
                            break;
                        case "feb":
                                mes = 2;
                            break;
                        case "mar":
                                mes = 3;
                            break;
                        case "abr":
                                mes = 4;
                            break;
                        case "may":
                                mes = 5;
                            break;
                        case "jun":
                                mes = 6;
                            break;
                        case "jul":
                                mes = 7;
                            break;
                        case "ago":
                                mes = 8;
                            break;
                        case "sep":
                                mes = 9;
                            break;
                        case "oct":
                                mes = 10;
                            break;
                        case "nov":
                                mes = 11;
                            break;
                        case "dic":
                                mes = 12;
                            break;
                        default:
                             
                            break
                    }
                    
                    var newDate = new Date(parseInt(periodoText.split(" ")[1]), mes, 0);
                    
                    var dateToInsert = format.parse({
                        value: newDate,
                        type: format.Type.DATE
                    });

                    invoice.setValue({fieldId: 'postingperiod', value: dataInvoice[i].periodo })
                    invoice.setValue({fieldId: 'trandate', value: dateToInsert})
                    invoice.setValue({fieldId: 'asofdate', value: dateToInsert})
                    log.audit({
                        title: "INVOICE",
                        details: JSON.stringify({invoice:invoice, dataInvoice:dataInvoice})
                    })
                    
                    invoice.setValue({fieldId: 'tobeemailed', value: false })
                    var idInvoice = invoice.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    log.audit({ title: 'idInvoice', details: idInvoice });
                    
                }
            } catch (error) {
                log.audit({title: 'Error al crear invoice', details: error});  
            }
        }

        function createSublist(form, data){
            try {

                var sublist = form.addSublist({
                    id : 'custpage_sublist',
                    type : ui.SublistType.INLINEEDITOR,
                    label : 'Tabla de Revenue Recognition'
                });

                sublist.addField({
                    id : 'custpage_nombre',
                    type : ui.FieldType.TEXT,
                    label : 'Nombre'
                }).updateDisplayType({
                    displayType: "DISABLED"
                });

                sublist.addField({
                    id : 'custpage_titulo',
                    type : ui.FieldType.TEXT,
                    label : 'Titulo Grant'
                }).updateDisplayType({
                    displayType: "DISABLED"
                });
                sublist.addField({
                    id : 'custpage_idgrant',
                    type : ui.FieldType.TEXT,
                    label : 'id Grant'
                }).updateDisplayType({
                    displayType: "HIDDEN"
                });
                sublist.addField({
                    id : 'custpage_idstructure',
                    type : ui.FieldType.TEXT,
                    label : 'id Estructura'
                }).updateDisplayType({
                    displayType: "HIDDEN"
                });

                sublist.addField({
                    id : 'custpage_memo',
                    type : ui.FieldType.TEXT,
                    label : 'Nota/Memo'
                }).updateDisplayType({
                    displayType: "DISABLED"
                });

                sublist.addField({
                    id : 'custpage_importe',
                    type : ui.FieldType.CURRENCY,
                    label : 'Importe'
                }).updateDisplayType({
                    displayType: "DISABLED"
                });

                sublist.addField({
                    id : 'custpage_subsidiary',
                    type : ui.FieldType.TEXT,
                    label : 'Subsidiary'
                }).updateDisplayType({
                    displayType: "DISABLED"
                });

                sublist.addField({
                    id : 'custpage_subsidiary_id',
                    type : ui.FieldType.TEXT,
                    label : 'Subsidiary ID'
                }).updateDisplayType({
                    displayType: "HIDDEN"
                });

                sublist.addField({
                    id : 'custpage_donante',
                    type : ui.FieldType.TEXT,
                    label : 'Donante'
                }).updateDisplayType({
                    displayType: "DISABLED"
                });
                sublist.addField({
                    id : 'custpage_donante_id',
                    type : ui.FieldType.TEXT,
                    label : 'Donante ID'
                }).updateDisplayType({
                    displayType: "HIDDEN"
                });

                sublist.addField({
                    id : 'custpage_location',
                    type : ui.FieldType.TEXT,
                    label : 'Location'
                }).updateDisplayType({
                    displayType: "DISABLED"
                });           

                sublist.addField({
                    id : 'custpage_periodo',
                    type : ui.FieldType.TEXT,
                    label : 'Periodo'
                }).updateDisplayType({
                    displayType: "DISABLED"
                });        

                sublist.addField({
                    id : 'custpage_periodo_id',
                    type : ui.FieldType.TEXT,
                    label : 'Periodo ID'
                }).updateDisplayType({
                    displayType: "HIDDEN"
                });           

                log.audit({
                    title: "DATA------------------",
                    details: data
                })

                log.audit({
                    title: "DATA LENGTH",
                    details: data.length
                })

                var datosAgrupdados = data;
                // var titulosOrdeados = [];
                // for (var i = 0; i < data.length; i++) {
                //     if (titulosOrdeados.indexOf(data[i].textGrant) == -1) {
                //         titulosOrdeados.push(data[i].textGrant)
                //         for (var j = 0; j < data.length; j++) {
                //             if (data[j].textGrant == titulosOrdeados[titulosOrdeados.length - 1]) {
                //                 if (datosAgrupdados.length > 0 && data[j].textGrant == datosAgrupdados[datosAgrupdados.length - 1].textGrant && data[j].name == datosAgrupdados[datosAgrupdados.length - 1].name) {
                //                     datosAgrupdados[datosAgrupdados.length - 1].total =
                //                         parseFloat(datosAgrupdados[datosAgrupdados.length - 1].total) +
                //                         parseFloat(data[j].total);
                //                 } else {
                //                     datosAgrupdados.push(data[j]);
                //                 }
                //             }
                //         }
                //     }
                // }

                log.audit({
                    title: "TITLES ----------------",
                    details: datosAgrupdados
                })



                // Se llena la sublista con los datos obtenidos
                for(var i = 0; i < datosAgrupdados.length; i++){   
                    var nombre = datosAgrupdados[i].textNombre || datosAgrupdados[i].textDonante || "--";
                    var grant = datosAgrupdados[i].textGrant;
                    var nota =  datosAgrupdados[i].nota || '';
                    var importe =  datosAgrupdados[i].total || '';
                    var idLocation = datosAgrupdados[i].idLocation ? datosAgrupdados[i].idLocation : "3";
                    
                    
                    if(nombre == ''){
                        nombre = '-';
                    }
                    if(grant == ''){
                        grant = '-';
                    }
                    if(nota == ''){
                        nota = '-';
                    }
                    if(nota == ''){
                        nota = '-';
                    }
                    
                    
                    sublist.setSublistValue({
                        id : 'custpage_sublist',
                        line : i,
                        value : 'Tabla de Revenue Recognition'
                    });
                    
                    sublist.setSublistValue({
                        id : 'custpage_nombre',
                        line : i,
                        value : nombre
                    });
                    
                    sublist.setSublistValue({
                        id : 'custpage_titulo',
                        line : i,
                        value :grant
                    });
                    
                    sublist.setSublistValue({
                        id : 'custpage_idgrant',
                        line : i,
                        value : datosAgrupdados[i].idGrant || 0
                    });

                    sublist.setSublistValue({
                        id : 'custpage_idstructure',
                        line : i,
                        value : datosAgrupdados[i].estructura || parseInt(0)
                    });
                    
                    sublist.setSublistValue({
                        id : 'custpage_memo',
                        line : i,
                        value : nota.substring(0,299)
                    });
                    
                    sublist.setSublistValue({
                        id : 'custpage_importe',
                        line : i,
                        value : importe
                    });
                    
                    sublist.setSublistValue({
                        id : 'custpage_subsidiary',
                        line : i,
                        value : datosAgrupdados[i].textSubsidiaria
                    });
                    sublist.setSublistValue({
                        id : 'custpage_subsidiary_id',
                        line : i,
                        value : datosAgrupdados[i].idSubsidiaria
                    });
                    
                    sublist.setSublistValue({
                        id : 'custpage_donante',
                        line : i,
                        value : datosAgrupdados[i].textDonante  || 2110
                    });
                    sublist.setSublistValue({
                        id : 'custpage_donante_id',
                        line : i,
                        value : datosAgrupdados[i].idDonante  || 2110
                    });
                    
                    sublist.setSublistValue({
                        id : 'custpage_location',
                        line : i,
                        value : idLocation
                    });
                    
                    sublist.setSublistValue({
                        id : 'custpage_periodo',
                        line : i,
                        value : datosAgrupdados[i].textPeriodo
                    });
                    sublist.setSublistValue({
                        id : 'custpage_periodo_id',
                        line : i,
                        value : datosAgrupdados[i].periodo1 || 193
                    });
                }
            } catch (error) {
                log.audit({title: 'Error al pintar la sublista', details: error});  
            }
        }
        // trans - ventas - crear facturas de venta 
        // Facturas de ventas
        // si no se puede hacer un asiento de diario
        // listas - relaciones. trabajos -> pledge order
        return {
            onRequest: onRequest
        }
    });
