/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 @description Script que actualiza de forma masiva los resumen de impuestos de las transacciones, ordenes de venta, ordenes de compra, factura venta, factura provedores
 */
// proyectos
// en los project task
// 
define(["N/search", "N/record", 'N/task', 'N/runtime'], function (search, record, task, runtime) {
    
    function rescheduleCurrentScript() {
        var scheduledScriptTask = task.create({
            taskType: task.TaskType.SCHEDULED_SCRIPT
        });
        scheduledScriptTask.scriptId = runtime.getCurrentScript().id;
        scheduledScriptTask.deploymentId = runtime.getCurrentScript().deploymentId;
        return scheduledScriptTask.submit();
    }

    function actualizarDatos(tipoDeBusqueda, arrayTiposImpuestos) {

       

        var busqueda = null;

        if (tipoDeBusqueda == "SALESORDER") {
            busqueda = search.load({
                id: 'customsearch4tech_search_sales_order'
            });
        } else if (tipoDeBusqueda == "PURCHASEORDER") {
            busqueda = search.load({
                id: 'customsearch_4tech_search_purchase_order'
            });
        } else if (tipoDeBusqueda == "INVOICE") {
            busqueda = search.load({
                id: 'customsearch_4tech_search_invoice',
            });
        } else if (tipoDeBusqueda == "VENDORBILL") {
            busqueda = search.load({
                id: 'customsearch_4tech_actualizar_vendo_bill',
            });
        }else if(tipoDeBusqueda == "VENDORCREDIT"){
            busqueda = search.load({
                id: 'customsearch_4tech_search_vendor_credit'
            });
        }

        log.audit({
            title: "INICIANDO....",
            details: "INICIANDO A CAMBIAR"
        })
        var resultData = busqueda.run();

        var start = 0;

        var elementId = null;
        var arrayIds = [];
        if (resultData != null) {
            do {
                var resultSet = resultData.getRange(start, start + 1000);
                for (var i = 0; i < resultSet.length; i++) {
                    var object = JSON.parse(JSON.stringify(resultSet[i]));
                    log.audit({
                        title: "TITLE; ",
                        details: object
                    })
                    // CUSTRECORD_FT_LCAP_TRANRELRES.custrecord_ft_lcap_artresimp
                    // CUSTRECORD_FT_LCAP_TRANRELRES.custrecord_ft_lcap_artresimp
                    if(object.values["CUSTRECORD_FT_LCAP_TRANRELRES.custrecord_ft_lcap_artresimp"].length == 0){
                        // arrayIds1.push(resultSet[i].getValue({ name: 'internalid' }))
                        arrayIds.push(parseInt(object.id));
                    }
                }
                start += 1000;
            } while (resultSet && resultSet.length == 1000)
        }
       
        var recordElement = null;

        log.audit({
            title: "ARRAY ITEM: ",
            details: arrayIds.length
        })
        log.audit({
            title: "ARRAY ITEM: ",
            details: arrayIds
        })
    
        
        if (arrayIds.length > 0) {
            for (var i = 0; i < arrayIds.length; i++) {
                if (runtime.getCurrentScript().getRemainingUsage() < 100) {
                    rescheduleCurrentScript();
                    // log.audit("Rescheduling status: " + task.checkStatus(taskId));
                    log.audit({
                        title: "CALLING:",
                        details: "SCHEDULE CALLING AGAIN"
                    })
                    return;
                }

                if (tipoDeBusqueda == "SALESORDER") {
                    try {
                        recordElement = record.load({
                            type: record.Type.SALES_ORDER,
                            id: arrayIds[i],
                            isDynamic: true
                        });
                    } catch (error) {
                        log.audit("Saltando al siguiente", "Este record no fue posible de cargar, se esta saltando al siguiente record")
                        continue;
                    }
                } else if (tipoDeBusqueda == "PURCHASEORDER") {
                    try {
                        recordElement = record.load({
                            type: record.Type.PURCHASE_ORDER,
                            id: arrayIds[i],
                            isDynamic: true
                        });
                    } catch (error) {
                        log.audit("Saltando al siguiente", "Este record no fue posible de cargar, se esta saltando al siguiente record")
                        continue;
                    }
                } else if (tipoDeBusqueda == "INVOICE") {
                    try {
                        recordElement = record.load({
                            type: record.Type.INVOICE,
                            id: arrayIds[i],
                            isDynamic: true
                        });
                    } catch (error) {
                        log.audit("Saltando al siguiente", "Este record no fue posible de cargar, se esta saltando al siguiente record")
                        continue;
                    }
                } else if (tipoDeBusqueda == "VENDORBILL") {
                    try {
                        recordElement = record.load({
                            type: record.Type.VENDOR_BILL,
                            id: arrayIds[i],
                            isDynamic: true
                        });
                    } catch (error) {
                        log.audit("Saltando al siguiente", "Este record no fue posible de cargar, se esta saltando al siguiente record")
                        continue;
                    }
                } else if(tipoDeBusqueda == "VENDORCREDIT"){
                    try {
                        recordElement = record.load({
                            type: record.Type.VENDOR_CREDIT,
                            id: arrayIds[i],
                            isDynamic: true
                        });
                    } catch (error) {
                        log.audit("Saltando al siguiente", "Este record no fue posible de cargar, se esta saltando al siguiente record")
                        continue;
                    }
                }
                
                var numLinesResumen = recordElement.getLineCount({ sublistId: 'recmachcustrecord_ft_lcap_tranrelres' });
              
                if (numLinesResumen == 0) {
                    var arrayItem = [];
                    var numLines = recordElement.getLineCount({ sublistId: "item" });
                    if (numLines > 0) {
                        for (var j = 0; j < numLines; j++) {
                            var item = recordElement.getSublistValue({ sublistId: "item", fieldId: "item", line: j });

                            var idTaxCode = recordElement.getSublistValue({ sublistId: "item", fieldId: "taxcode", line: j });

                            var amount = recordElement.getSublistValue({ sublistId: "item", fieldId: "amount", line: j });

                            arrayItem.push({
                                item: item,
                                idTaxCode: idTaxCode,
                                amount: amount,
                            });

                        }
                    }

                    
                    if (arrayItem.length > 0 && recordElement.getValue({fieldId: 'memo'}) != "VOID" ) {
                        // console.log('Entra al array no vacio de item');
                        var arrayIva = [];
                        
                        for(var j = 0 ; j < arrayItem.length ; j++ ){
                            arrayIva.push({})
                        }
                        
                        for (var j = 0; j < arrayItem.length; j++) {

                            var item = arrayItem[j].item;
                            var amount = arrayItem[j].amount;
                            var idTaxCode = arrayItem[j].idTaxCode;
                            idTaxCode = parseInt(idTaxCode)
                            // arrayTiposImpuestos
                            log.audit({
                                title: "TAX CODE",
                                details: idTaxCode
                            })
                            if (idTaxCode && idTaxCode != 1039 && idTaxCode != 12 && idTaxCode != 1008 && idTaxCode != 1043) { 
                                var recTaxCode = null;
                                var tipoTax = "";
                                for(var m = 0; m < arrayTiposImpuestos.length; m++){
                                    for(var n = 0; n < arrayTiposImpuestos[0].length; n++){
                                        if(arrayTiposImpuestos[0][n]["id"] == idTaxCode){
                                            
                                            recTaxCode = record.load({
                                                type: record.Type.TAX_TYPE,
                                                id: idTaxCode,
                                            });
                                            tipoTax = "taxtype"
                                            break;
                                        }
                                    
                                    }
                                    for(var n = 0; n < arrayTiposImpuestos[1].length; n++){
                                        if(arrayTiposImpuestos[1][n]["id"] == idTaxCode){

                                               recTaxCode = record.load({
                                                  type: record.Type.SALES_TAX_ITEM,
                                                  id: idTaxCode,
                                              });
                                              tipoTax = "salestaxitem"
                                            break;
                                        }
                                    }
                                    for(var n = 0; n < arrayTiposImpuestos[2].length; n++){
                                        if(arrayTiposImpuestos[2][n]["id"] == idTaxCode){
                                            
                                            recTaxCode = record.load({
                                                type: record.Type.TAX_GROUP,
                                                id: idTaxCode,
                                            });
                                            tipoTax = "taxgroup"
                                            break;
                                        }
                                    
                                    }
                                }
                                
                           
                                if (recTaxCode) {
                                    
                                    if(tipoTax == "taxgroup"){
                                        var numLinesTax = recTaxCode.getLineCount({ sublistId: "taxitem" });
                                        if (numLinesTax) {
                                            for (var k = 0; k < numLinesTax; k++) {
                                                var rate = recTaxCode.getSublistValue({ sublistId: "taxitem", fieldId: "rate", line: k }) || "";

                                                var rateName = recTaxCode.getSublistValue({ sublistId: "taxitem", fieldId: "taxname2", line: k }) || "";

                                                var idRate = recTaxCode.getSublistValue({ sublistId: "taxitem", fieldId: "taxname", line: k }) || "";

                                                if(rateName.indexOf("SI_No Genera Impuesto") > -1){
                                                    arrayIva[j].rateIva = 0;
                                                    arrayIva[j].idIva = idRate;
                                                    arrayIva[j].amount = amount;
                                                    arrayIva[j].item = item;
                                                }

                                                if (rateName.indexOf("IVA") > -1 && rateName.indexOf("RETIVA") == -1) {
                                                    
                                                    arrayIva[j].rateIva = rate;
                                                    arrayIva[j].idIva = idRate;
                                                    arrayIva[j].amount = amount;
                                                    arrayIva[j].item = item;
                                                    
        
                                                }
                                                if (rateName.indexOf("RTFTE") > -1) {
                                                    
                                                    arrayIva[j].rateRtfte = rate;
                                                    arrayIva[j].idRetefuente = idRate;
                                                    arrayIva[j].amount = amount;
                                                    arrayIva[j].item = item;
                                                    
                                                }
                                                
                                                if (rateName.indexOf("RTIVA") > -1 || rateName.indexOf("RETIVA") > -1) {
                                                    
                                                    arrayIva[j].rateRtiva = rate;
                                                    arrayIva[j].idRtiva = idRate;
                                                    arrayIva[j].amount = amount;
                                                    arrayIva[j].item = item;
                                                }
        
                                                if (rateName.indexOf("RIRVTAS") > -1) {
                                                    
                                                    arrayIva[j].rateRtfte = rate;
                                                    arrayIva[j].idRetefuente = idRate;
                                                    arrayIva[j].amount = amount;
                                                    arrayIva[j].item = item;

                                                }
        
                                                if (rateName.indexOf("RETIVAVEN") > -1) {
                                                      
                                                    arrayIva[j].rateRtiva = rate;
                                                    arrayIva[j].idRtiva = idRate;
                                                    arrayIva[j].amount = amount;
                                                    arrayIva[j].item = item;                                   
                                                }
                                                if (rateName.indexOf("RIRCOM") > -1) {
                                                   
                                                    arrayIva[j].rateRtfte = rate;
                                                    arrayIva[j].idRetefuente = idRate;
                                                    arrayIva[j].amount = amount;
                                                    arrayIva[j].item = item;                                      
                                                }
                                                if (rateName.indexOf("RETIVACOM") > -1) {
                                                
                                                    arrayIva[j].rateRtiva = rate;
                                                    arrayIva[j].idRtiva = idRate;
                                                    arrayIva[j].amount = amount;
                                                    arrayIva[j].item = item; 
                                                }
                                                if (rateName.indexOf("IGV") > -1) {
                                                    arrayIva[j].rateIva = rate;
                                                    arrayIva[j].idIva = idRate;
                                                    arrayIva[j].amount = amount;
                                                    arrayIva[j].item = item; 
                                                }
                                            }
                                        }
                                    }else if(tipoTax == "salestaxitem"){

                                        var rate = recTaxCode.getValue({ fieldId:"rate" });
                                        var rateName = recTaxCode.getValue({fieldId:"itemid"});
                                        var idRate =  recTaxCode.getValue({fieldId: "id"})
                                        if (rateName.indexOf("IVA") > -1 && rateName.indexOf("RETIVA") == -1) {
                                            arrayIva[j].rateIva = rate;
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].amount = amount;
                                            arrayIva[j].item = item;
                                        }
        
                                        if (rateName.indexOf("RTFTE") > -1) {
                                            arrayIva[j].rateRtfte = rate;
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].amount = amount;
                                            arrayIva[j].item = item;
        
                                        }
                                        if (rateName.indexOf("RTIVA") > -1  || rateName.indexOf("RETIVA") > -1) {
                                            
                                            arrayIva[j].rateRtiva = rate; 
                                            arrayIva[j].item = item; 
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRtiva = idRate;                                    
                                        }
        
                                        if (rateName.indexOf("RIRVTAS") > -1) {
                                            
                                            arrayIva[j].rateRtfte = rate; 
                                            arrayIva[j].item = item; 
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRetefuente = idRate;                                    
                                        }
                                        if (rateName.indexOf("RETIVACOM") > -1) {
                                            
                                            arrayIva[j].rateRtiva = rate; 
                                            arrayIva[j].item = item; 
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRtiva = idRate;                                    
                                        }
                                        if (rateName.indexOf("RETIVAVEN") > -1) {
                                            
                                            arrayIva[j].rateRtiva = rate; 
                                            arrayIva[j].item = item; 
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRtiva = idRate;
                                        }
                                        if (rateName.indexOf("RIRCOM") > -1) {
                                            
                                            arrayIva[j].rateRtfte = rate;
                                            arrayIva[j].idRetefuente = idRate;
                                            arrayIva[j].idIva = idRate;
                                        }
                                        if (rateName.indexOf("IGV") > -1) {
                                            arrayIva[j].rateIva = rate;
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].amount = amount;
                                            arrayIva[j].item = item; 
                                        }
                                        

                                    }else if(tipoTax == "taxtype"){
                                        // var rate = recTaxCode.getFieldValue({ fieldId:"rate" });
                                        var rateName = recTaxCode.getValue({fieldId:"name"});
                                        var idRate =  recTaxCode.getValue({fieldId: "id"});
               
                                        if (rateName == "8574_RIRVTAS_ORET 2,75%") {
                                            arrayIva[j].rateRtfte = 2.75, 
                                            arrayIva[j].item = item; 
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRetefuente = idRate;
                                        } else if (rateName == "8573_RIRVTAS_TRANSBIENES-1,75%") {
                                        
                                            arrayIva[j].rateRtfte =  1.75; 
                                            arrayIva[j].item =  item; 
                                            arrayIva[j].amount =  amount; 
                                            arrayIva[j].idIva =  idRate;
                                            arrayIva[j].idRetefuente =  idRate;
                                        } else if (rateName == "8572_RIRVTAS_ORET 2%") {
                                            
                                                
                                            arrayIva[j].rateRtfte = 2; 
                                            arrayIva[j].item = item;
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRetefuente = idRate;

                                        } else if (rateName == "8571_RIRVTAS_TRANSBIENES-1%") {
                                        
                                            arrayIva[j].rateRtfte= 1;
                                            arrayIva[j].item= item;
                                            arrayIva[j].amount= amount;
                                            arrayIva[j].idIva= idRate;
                                            arrayIva[j].idRetefuente= idRate;

                                        } else if (rateName == "731-100% RETIVACOM") {
                                            
                                            arrayIva[j].rateRtiva = 100; 
                                            arrayIva[j].item = item;
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRtiva = idRate;

                                        } else if (rateName == "729-70% RETIVACOM") {
                                            
                                            arrayIva[j].rateRtiva = 70; 
                                            arrayIva[j].item = item;
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRtiva = idRate;
                                        } else if (rateName == "727-50% RETIVACOM") {
                                            
                                            arrayIva[j].rateRtiva = 50; 
                                            arrayIva[j].item = item;
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRtiva = idRate;

                                        } else if (rateName == "725-30% RETIVACOM") {
                                            
                                            arrayIva[j].rateRtiva = 30; 
                                            arrayIva[j].item = item;
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRtiva = idRate;

                                        } else if (rateName == "723-20% RETIVACOM") {
                                            
                                            arrayIva[j].rateRtiva = 20; 
                                            arrayIva[j].item = item;
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRtiva = idRate;

                                        } else if (rateName == "721-10% RETIVACOM") {
                                            
                                            arrayIva[j].rateRtiva = 10; 
                                            arrayIva[j].item = item;
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRtiva = idRate;

                                        } else if (rateName == "609-70% RETIVAVEN") {
                                            
                                            arrayIva[j].rateRtiva = 70; 
                                            arrayIva[j].item = item;
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRtiva = idRate;

                                        } else if (rateName == "609-30% RETIVAVEN") {
                                            
                                            arrayIva[j].rateRtiva = 30; 
                                            arrayIva[j].item = item;
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRtiva = idRate;

                                        } else if (rateName == "609-20% RETIVAVEN") {
                                            
                                            arrayIva[j].rateRtiva = 20; 
                                            arrayIva[j].item = item;
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRtiva = idRate;

                                        } else if (rateName == "609-100% RETIVAVEN") {
                                            
                                            arrayIva[j].rateRtiva = 100; 
                                            arrayIva[j].item = item;
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRtiva = idRate;

                                        } else if (rateName == "609-10% RETIVAVEN") {
                                            
                                            arrayIva[j].rateRtiva = 10; 
                                            arrayIva[j].item = item;
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRtiva = idRate;

                                        } else if (rateName == "525_IVA_IMPAF-12%") {
                                            
                                            arrayIva[j].rateIva = 12 
                                            arrayIva[j].item = item
                                            arrayIva[j].amount = amount
                                            arrayIva[j].idIva = idRate

                                        } else if (rateName == "524_IVA_IMPBIEN-12%") {
                                            
                                            arrayIva[j].rateIva = 12 
                                            arrayIva[j].item = item
                                            arrayIva[j].amount = amount
                                            arrayIva[j].idIva = idRate

                                        } else if (rateName == "523_IVA_IMPSER-12%") {
                                            
                                            arrayIva[j].rateIva = 12 
                                            arrayIva[j].item = item
                                            arrayIva[j].amount = amount
                                            arrayIva[j].idIva = idRate
                                            
                                        } else if (rateName == "522_IVA_OAD-12%") {
                                            
                                            arrayIva[j].rateIva = 12 
                                            arrayIva[j].item = item
                                            arrayIva[j].amount = amount
                                            arrayIva[j].idIva = idRate

                                        } else if (rateName == "521_IVA_CAF-12%") {
                                            
                                            arrayIva[j].rateIva = 12 
                                            arrayIva[j].item = item
                                            arrayIva[j].amount = amount
                                            arrayIva[j].idIva = idRate

                                        } else if (rateName == "520_IVA_CL-12%") {
                                            
                                            arrayIva[j].rateIva = 12 
                                            arrayIva[j].item = item
                                            arrayIva[j].amount = amount
                                            arrayIva[j].idIva = idRate

                                        } else if (rateName == "517_IVA_CL0%") {
                                            
                                            arrayIva[j].rateIva = 0
                                            arrayIva[j].item = item
                                            arrayIva[j].amount = amount
                                            arrayIva[j].idIva = idRate
                                            
                                        } else if (rateName == "516_IVA_IMP0%") {
                                            
                                            arrayIva[j].rateIva = 0 
                                            arrayIva[j].item = item
                                            arrayIva[j].amount = amount
                                            arrayIva[j].idIva = idRate

                                        } else if (rateName == "501A_RIRCOM_25%") {
                                            
                                            arrayIva[j].rateRtfte = 25;
                                            arrayIva[j].item = item;
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRetefuente = idRate;

                                        } else if (rateName == "501A_RIRCOM_10%") {
                                            
                                            arrayIva[j].rateRtfte = 10;
                                            arrayIva[j].item = item;
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRetefuente = idRate;

                                        } else if (rateName == "501A_RIRCOM_0%") {
                                            
                                            arrayIva[j].rateRtfte = 0;
                                            arrayIva[j].item = item;
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRetefuente = idRate;

                                        } else if (rateName == "422_IVA_VAF-12%") {
                                            
                                            arrayIva[j].rateIva = 12 
                                            arrayIva[j].item = item
                                            arrayIva[j].amount = amount
                                            arrayIva[j].idIva = idRate

                                        } else if (rateName == "421_IVA_VL-12%") {
                                            
                                            arrayIva[j].rateIva = 12 
                                            arrayIva[j].item = item
                                            arrayIva[j].amount = amount
                                            arrayIva[j].idIva = idRate

                                        } else if (rateName == "418_IVA_0% EXPORTACIÓN DE SERVICIOS") {
                                            
                                            arrayIva[j].rateIva = 0
                                            arrayIva[j].item = item
                                            arrayIva[j].amount = amount
                                            arrayIva[j].idIva = idRate

                                        } else if (rateName == "345_RIRCOM_ORET 8%") {
                                            
                                            arrayIva[j].rateRtfte = 8;
                                            arrayIva[j].item = item;
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRetefuente = idRate;

                                        } else if (rateName == "3440_RIRCOM_ORET 2,75%") {
                                            
                                            arrayIva[j].rateRtfte = 2.75;
                                            arrayIva[j].item = item;
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRetefuente = idRate;

                                        } else if (rateName == "344_RIRCOM_ORET 2%") {
                                            
                                            arrayIva[j].rateRtfte = 2;
                                            arrayIva[j].item = item;
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRetefuente = idRate;

                                        } else if (rateName == "343_RIRCOM_ORET 1%") {
                                            
                                            arrayIva[j].rateRtfte = 1;
                                            arrayIva[j].item = item;
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRetefuente = idRate;

                                        } else if (rateName == "332_RIRCOM_PAGOSNOSUJRET-0%") {
                                            
                                            arrayIva[j].rateRtfte = 0;
                                            arrayIva[j].item = item;
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRetefuente = idRate;

                                        } else if (rateName == "332_G_RIRCOM_PAGOSCONTC-0%") {
                                            
                                            arrayIva[j].rateRtfte = 0;
                                            arrayIva[j].item = item;
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRetefuente = idRate;

                                        } else if (rateName == "325_RIRCOM_PAGDIVIDENDOS-25%") {
                                            
                                            arrayIva[j].rateRtfte = 25;
                                            arrayIva[j].item = item;
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRetefuente = idRate;

                                        } else if (rateName == "322_RIRCOM_SEGUROS-1.75%") {
                                            
                                            arrayIva[j].rateRtfte = 1.75;
                                            arrayIva[j].item = item;
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRetefuente = idRate;

                                        } else if (rateName == "320_RIRCOM_ARRENBIENES-8%") {
                                            
                                            arrayIva[j].rateRtfte = 8;
                                            arrayIva[j].item = item;
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRetefuente = idRate;

                                        } else if (rateName == "312_RIRCOM_TRANSBIENES-1,75%") {
                                            
                                            arrayIva[j].rateRtfte = 1.75;
                                            arrayIva[j].item = item;
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRetefuente = idRate;

                                        } else if (rateName == "311_RIRCOM_CONLIQCOM-0%") {
                                            
                                            arrayIva[j].rateRtfte = 0;
                                            arrayIva[j].item = item;
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRetefuente = idRate;

                                        } else if (rateName == "310_RIRCOM_TRANSPASAJ-1%") {
                                            
                                            arrayIva[j].rateRtfte = 1;
                                            arrayIva[j].item = item;
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRetefuente = idRate;

                                        } else if (rateName == "309_RIRCOM_PUBLYCOM-1%") {
                                            
                                            arrayIva[j].rateRtfte = 1;
                                            arrayIva[j].item = item;
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRetefuente = idRate;

                                        } else if (rateName == "308_RIRCOM_APROVIMAGEN-10%") {
                                            
                                            arrayIva[j].rateRtfte = 10;
                                            arrayIva[j].item = item;
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRetefuente = idRate;

                                        } else if (rateName == "307_RIRCOM_PREDOMMO-2%") {
                                            
                                            arrayIva[j].rateRtfte = 2;
                                            arrayIva[j].item = item;
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRetefuente = idRate;

                                        } else if (rateName == "304_RIRCOM_PREDOMINTELEC-8%") {
                                            
                                            arrayIva[j].rateRtfte = 8;
                                            arrayIva[j].item = item;
                                            arrayIva[j].amount = amount; 
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].idRetefuente = idRate;

                                        } else if(rateName == "PE05_IGV_SPND-18%"){
                                                arrayIva[j].rateIva = 18;
                                                arrayIva[j].idIva = idRate;
                                                arrayIva[j].amount = amount;
                                                arrayIva[j].item = item; 
                                            
                                        } else if(rateName == "PE04_IGV_CLME-18%"){
                                            arrayIva[j].rateIva = 18;
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].amount = amount;
                                            arrayIva[j].item = item; 
                                        
                                        } else if(rateName == "PE04_IGV_CLME-18%"){
                                            arrayIva[j].rateIva = 18;
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].amount = amount;
                                            arrayIva[j].item = item; 
                                        
                                        } else if(rateName == "PE02_IGV_VL-ME-18%"){
                                            arrayIva[j].rateIva = 18;
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].amount = amount;
                                            arrayIva[j].item = item; 
                                        } else if(rateName == "PE01_IGV_VL-MN-18%"){
                                            arrayIva[j].rateIva = 18;
                                            arrayIva[j].idIva = idRate;
                                            arrayIva[j].amount = amount;
                                            arrayIva[j].item = item; 
                                        }

               
                                    }
                                }
                            }else{
                                arrayIva.shift()
                            }
                        }
                        log.audit({
                            title: "TIENE IVA",
                            details: arrayIva
                        })
                        if (arrayIva.length > 0 && arrayIva[0].item != undefined) {

                            var totalImp = 0;

                            for (var q = 0; q < arrayIva.length; q++) {
                                // var nombres = arrayIva[q].rateName;
                                var totalI = arrayIva[q].total;
                                var amount = arrayIva[q].amount;
                                var idRetefuente = arrayIva[q].idRetefuente;
                                var rateRtfte = arrayIva[q].rateRtfte;
                                var idRtiva = arrayIva[q].idRtiva;
                                var rateRtiva = arrayIva[q].rateRtiva;
                                var idIva = arrayIva[q].idIva;
                                // var idIca = arrayIva[q].idIca;
                                // var rateIca = arrayIva[q].rateIca || '';
                                var rateIva = arrayIva[q].rateIva;
                                if (!rateIva) {
                                    rateIva = 0;
                                }
                                var item = arrayIva[q].item;
                                //  RIRVTAS
                                //     RETIVACOM
                                //     RETIVAVEN
                                //     RIRCOM

                                //         rateRirvtas
                                //     idRirvtas
                                //         rateRetivacom
                                //     idRetivacom
                                //         rateRreteivaven
                                //     idRreteivaven
                                //         rateRircom
                                //     idRircom

                                if (rateIva) {
                                    var totalImpIva = (rateIva * amount) / 100;
                                } else {
                                    rateIva = 0
                                    var totalImpIva = 0;
                                }
                                if (rateRtfte) {
                                    var totalImpRtf = (rateRtfte * amount) / 100;
                                } else {
                                    rateRtfte = 0
                                    var totalImpRtf = 0
                                }
                                if (rateRtiva) {
                                    var totalImpRtiva = (rateRtiva * amount) / 100;
                                } else {
                                    rateRtiva = 0
                                    var totalImpRtiva = 0;
                                }
                                totalImp = totalImpIva + totalImpRtf + totalImpRtiva ;

                                recordElement.selectNewLine({ sublistId: "recmachcustrecord_ft_lcap_tranrelres" });

                                recordElement.setCurrentSublistValue({
                                    sublistId: "recmachcustrecord_ft_lcap_tranrelres",
                                    fieldId: "custrecord_ft_lcap_artresimp",
                                    line: q,
                                    value: item
                                });

                                recordElement.setCurrentSublistValue({
                                    sublistId: "recmachcustrecord_ft_lcap_tranrelres",
                                    fieldId: "custrecord_ft_lcap_montbasres",
                                    line: q,
                                    value: amount
                                });
                               
                                recordElement.setCurrentSublistValue({
                                    sublistId: "recmachcustrecord_ft_lcap_tranrelres",
                                    fieldId: "custrecord_ft_lcap_codivares",// se inserta el codigo de iva
                                    line: q,
                                    value: idIva
                                });
                                
                                recordElement.setCurrentSublistValue({
                                    sublistId: "recmachcustrecord_ft_lcap_tranrelres",
                                    fieldId: "custrecord_ft_lcap_tarivares",
                                    line: q,
                                    value: (rateIva + "%")
                                });
                              
                                recordElement.setCurrentSublistValue({
                                    sublistId: "recmachcustrecord_ft_lcap_tranrelres",
                                    fieldId: "custrecord_ft_lcap_valivares",//valor de iva
                                    line: q,
                                    value: totalImpIva
                                });
                                
                                if (idRetefuente) {
                                    recordElement.setCurrentSublistValue({
                                        sublistId: "recmachcustrecord_ft_lcap_tranrelres",
                                        fieldId: "custrecord_ft_lcap_codrtfteres",
                                        line: q,
                                        value: idRetefuente
                                    });
                                }
                               
                                if (rateRtfte) {
                                    recordElement.setCurrentSublistValue({
                                        sublistId: "recmachcustrecord_ft_lcap_tranrelres",
                                        fieldId: "custrecord_ft_lcap_tarrtfteres",
                                        line: q,
                                        value: (rateRtfte + "%")
                                    });
                                    recordElement.setCurrentSublistValue({
                                        sublistId: "recmachcustrecord_ft_lcap_tranrelres",
                                        fieldId: "custrecord_ft_lcap_valrtfteres",
                                        line: q,
                                        value: totalImpRtf
                                    });
                                }
                               
                                if (idRtiva) {
                                    recordElement.setCurrentSublistValue({
                                        sublistId: "recmachcustrecord_ft_lcap_tranrelres",
                                        fieldId: "custrecord_ft_lcap_codrtivares", // mete el codigo de rtiva
                                        line: q,
                                        value: idRtiva
                                    });
                                }
                               
                                if (rateRtiva) {
                                    recordElement.setCurrentSublistValue({
                                        sublistId: "recmachcustrecord_ft_lcap_tranrelres",
                                        fieldId: "custrecord_ft_lcap_tarrtivares",
                                        line: q,
                                        value: (rateRtiva + "%")
                                    });
                                    recordElement.setCurrentSublistValue({
                                        sublistId: "recmachcustrecord_ft_lcap_tranrelres",
                                        fieldId: "custrecord_ft_lcap_valrtivares", //valor de rtiva
                                        line: q,
                                        value: totalImpRtiva
                                    });
                                   
                                }
                                // if (idIca) {
                                //     recordElement.setCurrentSublistValue({
                                //         sublistId: "recmachcustrecord_ft_lcap_tranrelres",
                                //         fieldId: "custrecord_ft_lcap_codicares",
                                //         line: q,
                                //         value: idIca
                                //     });
                                // }
                                // if (rateIca) {
                                //     recordElement.setCurrentSublistValue({
                                //         sublistId: "recmachcustrecord_ft_lcap_tranrelres",
                                //         fieldId: "custrecord_ft_lcap_taricares",
                                //         line: q,
                                //         value: (rateIca + '%')
                                //     });
                                //     recordElement.setCurrentSublistValue({
                                //         sublistId: "recmachcustrecord_ft_lcap_tranrelres",
                                //         fieldId: "custrecord_ft_lcap_valicares",
                                //         line: q,
                                //         value: totalImpIca
                                //     });
                                // }
                                if (totalImp) {
                                    recordElement.setCurrentSublistValue({
                                        sublistId: "recmachcustrecord_ft_lcap_tranrelres",
                                        fieldId: "custrecord_ft_lcap_totimpres",
                                        line: q,
                                        value: totalImp
                                    });
                                }
                                // window.opener.close();
                                recordElement.commitLine({ sublistId: "recmachcustrecord_ft_lcap_tranrelres" });

                            }
                            //log.audit({ title: 'totalImp', details: totalImp });
                            log.audit("record", recordElement);
                            if((tipoDeBusqueda == "SALESORDER" && recordElement.getValue({fieldId: "salesrep"})) || 
                                (tipoDeBusqueda == "PURCHASEORDER" && recordElement.getValue({fieldId: "memo"})) ||
                                (tipoDeBusqueda == "INVOICE" && recordElement.getValue({fieldId: "custbody_ft_krugertran_dettran_alldoc"})) ){
                                log.audit({
                                    title: "EL ELEMENTO A CAMBIAR ES",
                                    details: recordElement
                                }); 
                                var idRecord = recordElement.save({
                                    enableSourcing: true,   
                                    ignoreMandatoryFields: false    
                                });
                                log.audit({
                                    title: "EL ELEMENTO CAMBIADO",
                                    details: JSON.stringify({ idRecord: idRecord })
                                }); 
                            }else if((tipoDeBusqueda != "SALESORDER" && tipoDeBusqueda != "PURCHASEORDER" & tipoDeBusqueda != "INVOICE")){
                                log.audit({
                                    title: "EL ELEMENTO A CAMBIAR ES",
                                    details: recordElement
                                }); 
                                var idRecord = recordElement.save({
                                    enableSourcing: true,   
                                    ignoreMandatoryFields: false    
                                });
                                log.audit({
                                    title: "EL ELEMENTO CAMBIADO",
                                    details: JSON.stringify({ idRecord: idRecord })
                                }); 
                            }
                        }
                    }

                }
                // TERMINA IF
                
            }
        }
    }


    function execute(context) {
        

        var taxTypes = search.create({
            type: record.Type.TAX_TYPE,
          
            columns: [
                { name: 'internalid' },
                { name: 'name' }
            ]
        });

        var taxCodes = search.create({
            type: record.Type.SALES_TAX_ITEM,
           
            columns: [
                { name: 'internalid' },
                { name: 'itemid' }
            ]
        });

        var taxGroup = search.create({
            type: record.Type.TAX_GROUP,
           
            columns: [
                { name: 'internalid' },
                { name: 'itemid' }
            ]
        });

        var taxTypesResult = taxTypes.run();
        var taxCodesResult = taxCodes.run();
        var taxGroupsResult = taxGroup.run();
        var resultSetTax = null;
        var start = 0;
        var taxTypesArray = [];
        var taxCodesArray = [];
        var taxGroupsArray = [];
        if (taxTypesResult != null) {
            do {
                var resultSetTax = taxTypesResult.getRange(start, start + 1000);
                for (var i = 0; i < resultSetTax.length; i++) {
                    taxTypesArray.push({id: resultSetTax[i].getValue({ name: 'internalid' }), name: resultSetTax[i].getValue({ name: 'name' }) });
                }
                start += 1000;
            } while (resultSetTax && resultSetTax.length == 1000)
        }
        start = 0;
        if (taxCodesResult != null) {
            do {
                var resultSetTax = taxCodesResult.getRange(start, start + 1000);
                for (var i = 0; i < resultSetTax.length; i++) {
                    taxCodesArray.push({id: resultSetTax[i].getValue({ name: 'internalid' }), name: resultSetTax[i].getValue({ name: 'itemid' })});
                }
                start += 1000;
            } while (resultSetTax && resultSetTax.length == 1000)
        }
        start = 0;
        if (taxGroupsResult != null) {
            do {
                var resultSetTax = taxGroupsResult.getRange(start, start + 1000);
                for (var i = 0; i < resultSetTax.length; i++) {
                    taxGroupsArray.push({id: resultSetTax[i].getValue({ name: 'internalid' }), name: resultSetTax[i].getValue({ name: 'itemid' })});
                }
                start += 1000;
            } while (resultSetTax && resultSetTax.length == 1000)
        }

  


        // log.audit({
        //     title: "TAXES TYPES",
        //     details: taxTypes
        // });
        
        
        actualizarDatos("SALESORDER", [taxTypesArray, taxCodesArray, taxGroupsArray]);
        actualizarDatos("PURCHASEORDER", [taxTypesArray, taxCodesArray, taxGroupsArray]);
        actualizarDatos("INVOICE", [taxTypesArray, taxCodesArray, taxGroupsArray]);
        actualizarDatos("VENDORBILL", [taxTypesArray, taxCodesArray, taxGroupsArray]);
        actualizarDatos("VENDORCREDIT", [taxTypesArray, taxCodesArray, taxGroupsArray]);
    }

    return {
        execute: execute
    }
});
