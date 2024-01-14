/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
 define(["N/log", "N/search", "N/record"], function (log, search, record) {

    function pageInit(context) {

    }

    function cleanTaxElements(tax){
        var arrayElements = tax.split(",");
        var arrayClean = []
        var elemento = "";
        for(var i = 0; i < arrayElements.length ; i++){
            elemento = arrayElements[i].trim()
            if(elemento){
                arrayClean.push(elemento);
            }
        }
        return arrayClean;
    }

    function saveRecord(context) {
        try {

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
                        taxTypesArray.push({ id: resultSetTax[i].getValue({ name: 'internalid' }), name: resultSetTax[i].getValue({ name: 'name' }) });
                    }
                    start += 1000;
                } while (resultSetTax && resultSetTax.length == 1000)
            }
            start = 0;
            if (taxCodesResult != null) {
                do {
                    var resultSetTax = taxCodesResult.getRange(start, start + 1000);
                    for (var i = 0; i < resultSetTax.length; i++) {
                        taxCodesArray.push({ id: resultSetTax[i].getValue({ name: 'internalid' }), name: resultSetTax[i].getValue({ name: 'itemid' }) });
                    }
                    start += 1000;
                } while (resultSetTax && resultSetTax.length == 1000)
            }
            start = 0;
            if (taxGroupsResult != null) {
                do {
                    var resultSetTax = taxGroupsResult.getRange(start, start + 1000);
                    for (var i = 0; i < resultSetTax.length; i++) {
                        taxGroupsArray.push({ id: resultSetTax[i].getValue({ name: 'internalid' }), name: resultSetTax[i].getValue({ name: 'itemid' }) });
                    }
                    start += 1000;
                } while (resultSetTax && resultSetTax.length == 1000)
            }

            // Elimina, VAT_CO, UNDEF-CO
            for (var i = 0; i < taxTypesArray.length; i++) {
                if (taxTypesArray[i].name == "VAT_CO") {
                    taxTypesArray.splice(i, 1)
                }
            }
            for (var i = 0; i < taxCodesArray.length; i++) {
                if (taxCodesArray[i].name == "UNDEF-CO") {
                    taxCodesArray.splice(i, 1)
                }
            }

            var arrayTiposImpuestos = [taxTypesArray, taxCodesArray, taxGroupsArray];


            // deleteItemResume();
            var currentRecord = context.currentRecord;
            var numLinesResumen = currentRecord.getLineCount({ sublistId: "recmachcustrecord_ft_lcap_tranrelres" });;

            if (numLinesResumen) {
                for (var b = numLinesResumen; b >= 1; b--) {
                    var lineR = b - 1;
                    currentRecord.removeLine({
                        sublistId: "recmachcustrecord_ft_lcap_tranrelres",
                        line: lineR,
                        ignoreRecalc: true,
                    });
                }
                // return true;
            }

            var arrayItem = [];
            var arrayItemResume = [];
            // Toma todos los items de PO y SO para llenar el resumen de impuestos
            var numLines = currentRecord.getLineCount({ sublistId: "item" });
            // log.audit({ title: 'numLines', details: numLines })
            // if (numLinesResumen) {
            //    for (var z = 0; z < numLinesResumen; z++) {
            //       var itemResume = currentRecord.getSublistValue({ sublistId: "recmachcustrecord_ft_lcap_tranrelres",  fieldId: "custrecord_ft_lcap_artresimp",line: z });

            //       arrayItemResume.push(itemResume);
            //    }
            // }

            
            if (numLines) {
                
                for (var i = 0; i < numLines; i++) {
                    var item = currentRecord.getSublistValue({ sublistId: "item", fieldId: "item", line: i });

                    var idTaxCode = currentRecord.getSublistValue({ sublistId: "item", fieldId: "taxcode", line: i });

                    var amount = currentRecord.getSublistValue({ sublistId: "item", fieldId: "amount", line: i });
                    // if (arrayItemResume.indexOf(item) == -1) {
                    arrayItem.push({
                        item: item,
                        idTaxCode: idTaxCode,
                        amount: amount,
                    });
                    // }
                }
            }
            // log.audit({
            //     title: "CORRIENDO: ",
            //     details: "AQUI 1"
            // })
            var impuestosRecord = record.load({
                type: "customrecord_ft_lcap_parloc",
                id: 1,
                isDynamic: false
            });

            var pais = impuestosRecord.getText({fieldId: 'custrecord_ft_lcap_pais'});

            var arrayPrefijoIva = null;
            var arrayPrefijoRetefuente = null;
            var arrayPrefijoReteica = null;
            var arrayPrefijoReteiva = null;
            
            var arrayPrefijoIvaDel = null;
            var arrayPrefijoRetefuenteDel = null;
            var arrayPrefijoReteicaDel = null;
            var arrayPrefijoReteivaDel = null;
            // log.audit({
            //     title: "COUNTRY: ",
            //     details: pais
            // })

            /* Colombia */
            var ivaTaxColombia = (impuestosRecord.getValue({fieldId: "custrecord_ft_lc_prefiva"})).trim() || "";
            var icaTaxColombia = (impuestosRecord.getValue({fieldId: "custrecord_ft_lc_prefrica"})).trim() || "";
            var rivaTaxColombia = (impuestosRecord.getValue({fieldId: "custrecord_ft_lc_prefriva"})).trim() || "";
            var rtfteTaxColombia = (impuestosRecord.getValue({fieldId: "custrecord_ft_lc_prefrtfe"})).trim() || "";
            /* Ecuardor */
            var ivaTaxEcuador = (impuestosRecord.getValue({fieldId: "custrecord_ft_lc_prefivaec"})).trim() || "";
            var rtfteTaxEcuador = (impuestosRecord.getValue({fieldId: "custrecord_ft_lc_prefrfteec"})).trim() || "";
            var rivaTaxEcuador = (impuestosRecord.getValue({fieldId: "custrecord_ft_lc_prefrivaec"})).trim() || "";
            /* Peru */
            var ivaTaxPeru = (impuestosRecord.getValue({fieldId: "custrecord_ft_lc_prefigv"})).trim() || "";
            var rtfteTaxPeru = (impuestosRecord.getValue({fieldId: "custrecord_ft_lc_prefrir"})).trim() || "";
            /* Costa Rica */    
            var ivaTaxCostaRica = (impuestosRecord.getValue({fieldId: "custrecord_ft_lc_prefivacr"})).trim() || "";
            var rtfteTaxCostaRica = (impuestosRecord.getValue({fieldId: "custrecord_ft_lc_prefrftecr"})).trim() || "";
            var rivaTaxCostaRica = (impuestosRecord.getValue({fieldId: "custrecord_ft_lc_prefrivacr"})).trim() || "";
            if(ivaTaxColombia &&
                icaTaxColombia &&
                rivaTaxColombia &&
                rtfteTaxColombia){
                var ivaTaxColombiaDel = impuestosRecord.getValue({fieldId: "custrecord_ft_lc_prefiva_del"}) || "";
                var icaTaxColombiaDel = impuestosRecord.getValue({fieldId: "custrecord_ft_lc_prefrica_del"}) || "";
                var rivaTaxColombiaDel = impuestosRecord.getValue({fieldId: "custrecord_ft_lc_prefriva_del"}) || "";
                var rtfteTaxColombiaDel = impuestosRecord.getValue({fieldId: "custrecord_ft_lc_prefrtfe_del"}) || "";
                
                arrayPrefijoIva = cleanTaxElements(ivaTaxColombia);
                arrayPrefijoRetefuente = cleanTaxElements(rtfteTaxColombia);
                arrayPrefijoReteica = cleanTaxElements(icaTaxColombia);
                arrayPrefijoReteiva = cleanTaxElements(rivaTaxColombia);

                arrayPrefijoIvaDel = cleanTaxElements(ivaTaxColombiaDel);
                arrayPrefijoReteicaDel = cleanTaxElements(icaTaxColombiaDel);
                arrayPrefijoReteivaDel = cleanTaxElements(rivaTaxColombiaDel);
                arrayPrefijoRetefuenteDel = cleanTaxElements(rtfteTaxColombiaDel);
                // log.audit({
                //     title: "TITLE: ",
                //     details: JSON.stringify({
                //         arrayPrefijoReteica:arrayPrefijoReteica,
                //         arrayPrefijoReteicaDel:arrayPrefijoReteicaDel
                //     })
                // });
            }else if(ivaTaxEcuador &&
                rtfteTaxEcuador &&
                rivaTaxEcuador){

                
                
                var ivaTaxEcuadorDel = impuestosRecord.getValue({fieldId: "custrecord_ft_lc_prefivaec_del"}) || "";
                var rtfteTaxEcuadorDel = impuestosRecord.getValue({fieldId: "custrecord_ft_lc_prefrfteec_del"}) || "";
                var rivaTaxEcuadorDel = impuestosRecord.getValue({fieldId: "custrecord_ft_lc_prefrivaec_del"}) || "";
                
                arrayPrefijoIva = cleanTaxElements(ivaTaxEcuador);
                arrayPrefijoRetefuente = cleanTaxElements(rtfteTaxEcuador);
                arrayPrefijoReteiva = cleanTaxElements(rivaTaxEcuador);

                arrayPrefijoIvaDel = cleanTaxElements(ivaTaxEcuadorDel);
                arrayPrefijoRetefuenteDel = cleanTaxElements(rtfteTaxEcuadorDel);
                arrayPrefijoReteivaDel = cleanTaxElements(rivaTaxEcuadorDel);

            }else if(ivaTaxPeru && 
                rtfteTaxPeru){

               
                
                var ivaTaxPeruDel = impuestosRecord.getValue({fieldId: "custrecord_ft_lc_prefigv_del"}) || "";
                var rtfteTaxPeruDel = impuestosRecord.getValue({fieldId: "custrecord_ft_lc_prefrir_del"}) || "";

                arrayPrefijoIva = cleanTaxElements(ivaTaxPeru);
                arrayPrefijoRetefuente = cleanTaxElements(rtfteTaxPeru);

                arrayPrefijoIvaDel = cleanTaxElements(ivaTaxPeruDel);
                arrayPrefijoRetefuenteDel = cleanTaxElements(rtfteTaxPeruDel);

            }else if(
                ivaTaxCostaRica &&
                rtfteTaxCostaRica &&
                rivaTaxCostaRica){
                
                
                var ivaTaxCostaRicaDel = impuestosRecord.getValue({fieldId: "custrecord_ft_lc_prefivacr_del"}) || "";
                var rtfteTaxCostaRicaDel = impuestosRecord.getValue({fieldId: "custrecord_ft_lc_prefrftecr_del"}) || "";
                var rivaTaxCostaRicaDel = impuestosRecord.getValue({fieldId: "custrecord_ft_lc_prefrivacr_del"}) || "";
                
                arrayPrefijoIva = cleanTaxElements(ivaTaxCostaRica);
                arrayPrefijoRetefuente = cleanTaxElements(rtfteTaxCostaRica);
                arrayPrefijoReteiva = cleanTaxElements(rivaTaxCostaRica);

                arrayPrefijoIvaDel = cleanTaxElements(ivaTaxCostaRicaDel);
                arrayPrefijoRetefuenteDel = cleanTaxElements(rtfteTaxCostaRicaDel);
                arrayPrefijoReteivaDel = cleanTaxElements(rivaTaxCostaRicaDel);
            }

            // log.audit({
            //     title: "COUNTRY: ",
            //     details: JSON.stringify({
            //         arrayPrefijoIva: arrayPrefijoIva,
            //         arrayPrefijoRetefuente: arrayPrefijoRetefuente,
            //         arrayPrefijoReteica: arrayPrefijoReteica,
            //         arrayPrefijoReteiva: arrayPrefijoReteiva,
            //         arrayPrefijoIvaDel: arrayPrefijoIvaDel,
            //         arrayPrefijoReteicaDel: arrayPrefijoReteicaDel,
            //         arrayPrefijoReteivaDel: arrayPrefijoReteivaDel,
            //         arrayPrefijoRetefuenteDel: arrayPrefijoRetefuenteDel
            //     })
            // })
            

            // log.audit({ title: 'arrayItem', details: arrayItem });
            // console.log('arrayItem', arrayItem);
            // si tiene información en item, carga el taxcode
            var tipoTax = ""
            console.log("Array item: ", arrayItem)
            if (arrayItem) {
                // console.log('Entra al array no vacio de item');
                var arrayIva = [];

                for(var i = 0 ; i < arrayItem.length ; i++ ){
                    arrayIva.push({})
                }
                console.log("Array Iva: ", arrayIva);
                // log.audit({
                //     title: "ARRAY IVA",
                //     details: arrayIva
                // })
                // log.audit({
                //     title: "ARRAY ITEMS",
                //     details: arrayItem
                // })
                for (var j = 0; j < arrayItem.length; j++) {
                    var item = arrayItem[j].item;
                    var amount = arrayItem[j].amount;
                    var idTaxCode = arrayItem[j].idTaxCode;

                    if (idTaxCode) {
                        for (var m = 0; m < arrayTiposImpuestos.length; m++) {
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

                            // log.audit({
                            //     title: "REC TAX CODE",
                            //     details: JSON.stringify({
                            //         record: recTaxCode,
                            //         tipoTax:tipoTax,
                            //         rate: recTaxCode.getValue({ fieldId: "rate" }),
                            //         itemID: recTaxCode.getValue({ fieldId: "itemid" }),
                            //         id: recTaxCode.getValue({ fieldId: "id" })
                            //     })
                            // })

                            if (tipoTax == "taxgroup") {
                                
                                var numLinesTax = recTaxCode.getLineCount({ sublistId: "taxitem" });
                                if (numLinesTax) {
                                    for (var k = 0; k < numLinesTax; k++) {
                                        var rate = recTaxCode.getSublistValue({ sublistId: "taxitem", fieldId: "rate", line: k }) || "";

                                        var rateName = recTaxCode.getSublistValue({ sublistId: "taxitem", fieldId: "taxname2", line: k }) || "";

                                        var idRate = recTaxCode.getSublistValue({ sublistId: "taxitem", fieldId: "taxname", line: k }) || "";

                                        if(arrayPrefijoRetefuente.length > 0){
                                            for(var l = 0; l < arrayPrefijoRetefuente.length ; l++){
                                                if(arrayPrefijoRetefuenteDel.length > 0){
                                                    var containTheWord = false;
                                                    for (var m = 0; m < arrayPrefijoRetefuenteDel.length; m++) {
                                                        if(rateName.indexOf(arrayPrefijoRetefuenteDel[m]) > -1){
                                                            
                                                            containTheWord = true;
                                                            break;
                                                        }else{
                                                            containTheWord = false;
                                                        }
                                                    }
                                                    if(!containTheWord && rateName.indexOf(arrayPrefijoRetefuente[l]) > -1){
                                                        arrayIva[j].rateRtfte = rate;
                                                        arrayIva[j].idRetefuente = idRate;
                                                        arrayIva[j].amount = amount;
                                                        arrayIva[j].item = item;
                                                    }
                                                }else{
                                                    if(rateName.indexOf(arrayPrefijoRetefuente[l]) > -1){
                                                        arrayIva[j].rateRtfte = rate;
                                                        arrayIva[j].idRetefuente = idRate;
                                                        arrayIva[j].amount = amount;
                                                        arrayIva[j].item = item;
                                                    }
                                                }
                                            }
                                        }
        
                                        if(arrayPrefijoReteica.length > 0){
                                            for(var l = 0; l < arrayPrefijoReteica.length ; l++){
                                                if(arrayPrefijoReteicaDel.length > 0){
                                                    var containTheWord = false;
                                                    for (var m = 0; m < arrayPrefijoReteicaDel.length; m++) {
                                                        if(rateName.indexOf(arrayPrefijoReteicaDel[m]) > -1){
                                                            containTheWord = true;
                                                            break;
                                                        }else{
                                                            containTheWord = false;
                                                        }
                                                    }
                                                    if(!containTheWord  && rateName.indexOf(arrayPrefijoReteica[l]) > -1){
                                                        arrayIva[j].rateIca = rate;
                                                        arrayIva[j].idIca = idRate;
                                                        arrayIva[j].amount = amount;
                                                        arrayIva[j].item = item;
                                                    }
                                                }else{
                                                    if(rateName.indexOf(arrayPrefijoReteica[l]) > -1){
                                                        arrayIva[j].rateIca = rate;
                                                        arrayIva[j].idIca = idRate;
                                                        arrayIva[j].amount = amount;
                                                        arrayIva[j].item = item;
                                                    }
                                                }
                                            }
                                        }
        
                                        if(arrayPrefijoReteiva.length > 0){
                                            for(var l = 0; l < arrayPrefijoReteiva.length ; l++){
                                                if(arrayPrefijoReteivaDel.length > 0){
                                                    var containTheWord = false;
                                                    for (var m = 0; m < arrayPrefijoReteivaDel.length; m++) {
                                                        if(rateName.indexOf(arrayPrefijoReteivaDel[m]) > -1){
                                                            containTheWord = true;
                                                            break;
                                                        }else{
                                                            containTheWord = false;
                                                        }
                                                    }
                                                    if(!containTheWord && rateName.indexOf(arrayPrefijoReteiva[l]) > -1){
                                                        arrayIva[j].rateRtiva = rate;
                                                        arrayIva[j].idRtiva = idRate;
                                                        arrayIva[j].amount = amount;
                                                        arrayIva[j].item = item;  
                                                    }
                                                }else{
                                                    if(rateName.indexOf(arrayPrefijoReteiva[l]) > -1){
                                                        arrayIva[j].rateRtiva = rate;
                                                        arrayIva[j].idRtiva = idRate;
                                                        arrayIva[j].amount = amount;
                                                        arrayIva[j].item = item;  
                                                    }
                                                }
                                            }
                                        }
        
                                        if(arrayPrefijoIva.length > 0){
                                            for(var l = 0; l < arrayPrefijoIva.length ; l++){
                                                if(arrayPrefijoIvaDel.length > 0){
                                                    var containTheWord = false;
                                                    for (var m = 0; m < arrayPrefijoIvaDel.length; m++) {
                                                        if(rateName.indexOf(arrayPrefijoIvaDel[m]) > -1){
                                                            containTheWord = true;
                                                            break;
                                                        }else{
                                                            containTheWord = false;
                                                        }
                                                    }
                                                    if(!containTheWord && rateName.indexOf(arrayPrefijoIva[l]) > -1){
                                                        arrayIva[j].rateIva = rate;
                                                        arrayIva[j].idIva = idRate;
                                                        arrayIva[j].amount = amount;
                                                        arrayIva[j].item = item;
                                                    }
                                                }else{
                                                    if(rateName.indexOf(arrayPrefijoIva[l]) > -1){
                                                        arrayIva[j].rateIva = rate;
                                                        arrayIva[j].idIva = idRate;
                                                        arrayIva[j].amount = amount;
                                                        arrayIva[j].item = item;
                                                    }
                                                }
                                            }
                                        }
        

                                    }
                                }
                            } else if (tipoTax == "salestaxitem") {

                                var rate = recTaxCode.getValue({ fieldId: "rate" });
                                var rateName = recTaxCode.getValue({ fieldId: "description" }) || recTaxCode.getValue({ fieldId: "itemid" });
                                var idRate = recTaxCode.getValue({ fieldId: "id" })
                                
                                if(arrayPrefijoRetefuente.length > 0){
                                    for(var l = 0; l < arrayPrefijoRetefuente.length ; l++){
                                        // log.audit({
                                        //     title: "ARRAY PREFIJO RETEFUENTE",
                                        //     details: arrayPrefijoRetefuente[l]
                                        // })
                                        if(arrayPrefijoRetefuenteDel.length > 0){
                                            var containTheWord = false;
                                            for (var m = 0; m < arrayPrefijoRetefuenteDel.length; m++) {
                                                if(rateName.indexOf(arrayPrefijoRetefuenteDel[m]) > -1){
                                                    
                                                    containTheWord = true;
                                                    break;
                                                }else{
                                                    containTheWord = false;
                                                }
                                            }
                                            if(!containTheWord && rateName.indexOf(arrayPrefijoRetefuente[l]) > -1){
                                                arrayIva[j].rateRtfte = rate;
                                                arrayIva[j].idRetefuente = idRate;
                                                arrayIva[j].idRetefuente = idRate;
                                                arrayIva[j].amount = amount;
                                                arrayIva[j].item = item;
                                            }
                                        }else{
                                            if(rateName.indexOf(arrayPrefijoRetefuente[l]) > -1){
                                                arrayIva[j].rateRtfte = rate;
                                                arrayIva[j].idRetefuente = idRate;
                                                arrayIva[j].idRetefuente = idRate;
                                                arrayIva[j].amount = amount;
                                                arrayIva[j].item = item;
                                            }
                                        }
                                    }
                                }

                                if(arrayPrefijoReteica.length > 0){
                                    for(var l = 0; l < arrayPrefijoReteica.length ; l++){
                                        if(arrayPrefijoReteicaDel.length > 0){
                                            var containTheWord = false;
                                            for (var m = 0; m < arrayPrefijoReteicaDel.length; m++) {
                                                if(rateName.indexOf(arrayPrefijoReteicaDel[m]) > -1){
                                                    containTheWord = true;
                                                    break;
                                                }else{
                                                    containTheWord = false;
                                                }
                                            }
                                            if(!containTheWord  && rateName.indexOf(arrayPrefijoReteica[l]) > -1){
                                                arrayIva[j].rateIca = rate;
                                                arrayIva[j].idIca = idRate;
                                                arrayIva[j].amount = amount;
                                                arrayIva[j].item = item;
                                            }
                                        }else{
                                            if(rateName.indexOf(arrayPrefijoReteica[l]) > -1){
                                                arrayIva[j].rateIca = rate;
                                                arrayIva[j].idIca = idRate;
                                                arrayIva[j].amount = amount;
                                                arrayIva[j].item = item;
                                            }
                                        }
                                    }
                                }

                                if(arrayPrefijoReteiva.length > 0){
                                    for(var l = 0; l < arrayPrefijoReteiva.length ; l++){
                                        if(arrayPrefijoReteivaDel.length > 0){
                                            var containTheWord = false;
                                            for (var m = 0; m < arrayPrefijoReteivaDel.length; m++) {
                                                if(rateName.indexOf(arrayPrefijoReteivaDel[m]) > -1){
                                                    containTheWord = true;
                                                    break;
                                                }else{
                                                    containTheWord = false;
                                                }
                                            }
                                            if(!containTheWord && rateName.indexOf(arrayPrefijoReteiva[l]) > -1){
                                                arrayIva[j].rateRtiva = rate;
                                                arrayIva[j].idRtiva = idRate;
                                                arrayIva[j].amount = amount;
                                                arrayIva[j].item = item;  
                                            }
                                        }else{
                                            if(rateName.indexOf(arrayPrefijoReteiva[l]) > -1){
                                                arrayIva[j].rateRtiva = rate;
                                                arrayIva[j].idRtiva = idRate;
                                                arrayIva[j].amount = amount;
                                                arrayIva[j].item = item;  
                                            }
                                        }
                                    }
                                }

                                if(arrayPrefijoIva.length > 0){
                                    for(var l = 0; l < arrayPrefijoIva.length ; l++){
                                        if(arrayPrefijoIvaDel.length > 0){
                                            var containTheWord = false;
                                            for (var m = 0; m < arrayPrefijoIvaDel.length; m++) {
                                                if(rateName.indexOf(arrayPrefijoIvaDel[m]) > -1){
                                                    containTheWord = true;
                                                    break;
                                                }else{
                                                    containTheWord = false;
                                                }
                                            }
                                            if(!containTheWord && rateName.indexOf(arrayPrefijoIva[l]) > -1){
                                                arrayIva[j].rateIva = rate;
                                                arrayIva[j].idIva = idRate;
                                                arrayIva[j].amount = amount;
                                                arrayIva[j].item = item;
                                            }
                                        }else{
                                            if(rateName.indexOf(arrayPrefijoIva[l]) > -1){
                                                arrayIva[j].rateIva = rate;
                                                arrayIva[j].idIva = idRate;
                                                arrayIva[j].amount = amount;
                                                arrayIva[j].item = item;
                                            }
                                        }
                                    }
                                }

                                // log.audit({
                                //     title: "ARRAY IVA",
                                //     details: JSON.stringify({
                                //         arrayIva: arrayIva,
                                //         rateName: rateName
                                //     })
                                // })

                            }else if(tipoTax == "taxtype"){
                                arrayIva = [];
                                // var rate = recTaxCode.getFieldValue({ fieldId:"rate" });
                                // var rateName = recTaxCode.getValue({fieldId:"name"});
                                // var idRate =  recTaxCode.getValue({fieldId: "id"});
                                // rateText = rateName.replace(/[A-z .]/g,"");
                                // rateName = rateName.split(" ")[0];

                                // var rate = null;
                                // if(rateText.indexOf("%") > -1){
                                //     rateText = rateText.replace(/[%]/g, "")
                                //     if(rateText.indexOf(",") > -1){
                                //         rateText = rateText.replace(/[,]/g, ".")
                                //     }
                                //     rate = parseFloat(rateText)
                                // }
                                // // else if(rateText.indexOf("*") > -1){
                                // //     var valores = rateText.split("*");
                                    
                                // // }
                                
                                // log.audit({
                                //     title: "ALLL INFO: ",
                                //     details: JSON.stringify({
                                //         rateName: rateName,
                                //         rateText: rateText,
                                //         idRate: idRate
                                //     })
                                // })

                                // if(arrayPrefijoRetefuente.length > 0){
                                //     for(var l = 0; l < arrayPrefijoRetefuente.length ; l++){
                                //         if(arrayPrefijoRetefuenteDel.length > 0){
                                //             var containTheWord = false;
                                //             for (var m = 0; m < arrayPrefijoRetefuenteDel.length; m++) {
                                //                 if(rateName.indexOf(arrayPrefijoRetefuenteDel[m]) > -1){
                                //                     containTheWord = true;
                                //                     break;
                                //                 }else{
                                //                     containTheWord = false;
                                //                 }
                                //             }
                                //             if(!containTheWord){
                                //                 arrayIva[j].rateRtfte = rate;
                                //                 arrayIva[j].idRetefuente = idRate;
                                //                 arrayIva[j].amount = amount;
                                //                 arrayIva[j].item = item;
                                //             }
                                //         }else{
                                //             if(rateName.indexOf(arrayPrefijoRetefuente[l]) > -1){
                                //                 arrayIva[j].rateRtfte = rate;
                                //                 arrayIva[j].idRetefuente = idRate;
                                //                 arrayIva[j].amount = amount;
                                //                 arrayIva[j].item = item;
                                //             }
                                //         }
                                //     }
                                // }

                                // if(arrayPrefijoReteica.length > 0){
                                //     for(var l = 0; l < arrayPrefijoReteica.length ; l++){
                                //         if(arrayPrefijoReteicaDel.length > 0){
                                //             var containTheWord = false;
                                //             for (var m = 0; m < arrayPrefijoReteicaDel.length; m++) {
                                //                 if(rateName.indexOf(arrayPrefijoReteicaDel[m]) > -1){
                                //                     containTheWord = true;
                                //                     break;
                                //                 }else{
                                //                     containTheWord = false;
                                //                 }
                                //             }
                                //             if(!containTheWord){
                                //                 arrayIva[j].rateIca = rate;
                                //                 arrayIva[j].idIca = idRate;
                                //                 arrayIva[j].amount = amount;
                                //                 arrayIva[j].item = item;
                                //             }
                                //         }else{
                                //             if(rateName.indexOf(arrayPrefijoReteica[l]) > -1){
                                //                 arrayIva[j].rateIca = rate;
                                //                 arrayIva[j].idIca = idRate;
                                //                 arrayIva[j].amount = amount;
                                //                 arrayIva[j].item = item;
                                //             }
                                //         }
                                //     }
                                // }

                                // if(arrayPrefijoReteiva.length > 0){
                                //     for(var l = 0; l < arrayPrefijoReteiva.length ; l++){
                                //         if(arrayPrefijoReteivaDel.length > 0){
                                //             var containTheWord = false;
                                //             for (var m = 0; m < arrayPrefijoReteivaDel.length; m++) {
                                //                 if(rateName.indexOf(arrayPrefijoReteivaDel[m]) > -1){
                                //                     containTheWord = true;
                                //                     break;
                                //                 }else{
                                //                     containTheWord = false;
                                //                 }
                                //             }
                                //             if(!containTheWord){
                                //                 arrayIva[j].rateRtiva = rate;
                                //                 arrayIva[j].idRtiva = idRate;
                                //                 arrayIva[j].amount = amount;
                                //                 arrayIva[j].item = item;  
                                //             }
                                //         }else{
                                //             if(rateName.indexOf(arrayPrefijoReteiva[l]) > -1){
                                //                 arrayIva[j].rateRtiva = rate;
                                //                 arrayIva[j].idRtiva = idRate;
                                //                 arrayIva[j].amount = amount;
                                //                 arrayIva[j].item = item;  
                                //             }
                                //         }
                                //     }
                                // }

                                // if(arrayPrefijoIva.length > 0){
                                //     for(var l = 0; l < arrayPrefijoIva.length ; l++){
                                //         if(arrayPrefijoIvaDel.length > 0){
                                //             var containTheWord = false;
                                //             for (var m = 0; m < arrayPrefijoIvaDel.length; m++) {
                                //                 if(rateName.indexOf(arrayPrefijoIvaDel[m]) > -1){
                                //                     containTheWord = true;
                                //                     break;
                                //                 }else{
                                //                     containTheWord = false;
                                //                 }
                                //             }
                                //             if(!containTheWord){
                                //                 arrayIva[j].rateIva = rate;
                                //                 arrayIva[j].idIva = idRate;
                                //                 arrayIva[j].amount = amount;
                                //                 arrayIva[j].item = item;
                                //             }
                                //         }else{
                                //             if(rateName.indexOf(arrayPrefijoIva[l]) > -1){
                                //                 arrayIva[j].rateIva = rate;
                                //                 arrayIva[j].idIva = idRate;
                                //                 arrayIva[j].amount = amount;
                                //                 arrayIva[j].item = item;
                                //             }
                                //         }
                                //     }
                                // }


                            }
                        }
                        // if (recTaxCode) {
                        //    var numLinesTax = recTaxCode.getLineCount({sublistId: "taxitem" });

                        //    if (numLinesTax) {
                        //       for (var k = 0; k < numLinesTax; k++) {
                        //          var rate = recTaxCode.getSublistValue({  sublistId: "taxitem", fieldId: "rate",  line: k }) || "";

                        //          var rateName =recTaxCode.getSublistValue({ sublistId: "taxitem", fieldId: "taxname2", line: k }) || "";

                        //          var idRate = recTaxCode.getSublistValue({sublistId: "taxitem", fieldId: "taxname",line: k}) || "";


                        //          if (rateName.includes("IVA") && !rateName.includes("RTIVA") ) {

                        //             arrayIva.push({
                        //                rateIva: rate,
                        //                idIva: idRate,
                        //                amount: amount,
                        //                item: item,
                        //             });
                        //          }
                        //          if (rateName.includes("RTFTE")) {
                        //             for (var l = 0; l < arrayIva.length; l++) {
                        //                arrayIva[l].rateRtfte = rate;
                        //                arrayIva[l].idRetefuente = idRate;
                        //             }
                        //          }
                        //          if (rateName.includes("RTIVA")) {
                        //             for (var l = 0; l < arrayIva.length; l++) {
                        //                arrayIva[l].rateRtiva = rate;
                        //                arrayIva[l].idRtiva = idRate;
                        //             }
                        //          }
                        //          if (rateName.includes("ICA")) {
                        //             for (var l = 0; l < arrayIva.length; l++) {
                        //                arrayIva[l].rateIca = rate;
                        //                arrayIva[l].idIca = idRate;
                        //             }
                        //          }
                        //       }
                        //    }
                        // }
                    }
                }

                // log.audit({ title: 'arrayIva', details: arrayIva });
                console.log("ARRAY IVA:", arrayIva)
                if (arrayIva.length > 0 && arrayIva[0].item != undefined) {

                    // log.audit({ title: 'entra al array iva no vacio', details: arrayIva });

                    var totalImp = 0;

                    for (var q = 0; q < arrayIva.length; q++) {
                        // var nombres = arrayIva[q].rateName;
                        var total = arrayIva[q].total;
                        var amount = arrayIva[q].amount;
                        var idRetefuente = arrayIva[q].idRetefuente;
                        var rateRtfte = arrayIva[q].rateRtfte;
                        var idRtiva = arrayIva[q].idRtiva;
                        var rateRtiva = arrayIva[q].rateRtiva;
                        var idIva = arrayIva[q].idIva;
                        var idIca = arrayIva[q].idIca || null;
                        var rateIca = arrayIva[q].rateIca || null;
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
                        if (rateIca) {
                            var totalImpIca = (rateIca * amount) / 100;
                        }
                        totalImp = totalImpIva + totalImpRtf + totalImpRtiva;
                        // log.audit({
                        //     title: "TODOS IMP",
                        //     details: JSON.stringify({
                        //         totalImp: totalImp,
                        //         totalImpIva: totalImpIva,
                        //         totalImpRtf: totalImpRtf,
                        //         totalImpRtiva: totalImpRtiva
                        //     })
                        // })

                        currentRecord.selectNewLine({ sublistId: "recmachcustrecord_ft_lcap_tranrelres" });
                        // log.audit({
                        //     title: "AQUI",
                        //     details: 1
                        // })
                        currentRecord.setCurrentSublistValue({
                            sublistId: "recmachcustrecord_ft_lcap_tranrelres",
                            fieldId: "custrecord_ft_lcap_artresimp",
                            line: q,
                            value: item
                        });
                        // log.audit({
                        //     title: "AQUI",
                        //     details: 2
                        // })
                        currentRecord.setCurrentSublistValue({
                            sublistId: "recmachcustrecord_ft_lcap_tranrelres",
                            fieldId: "custrecord_ft_lcap_montbasres",
                            line: q,
                            value: amount
                        });
                        // log.audit({
                        //     title: "AQUI",
                        //     details: 3
                        // })
                        // log.audit({
                        //     title: "idIva",
                        //     details: idIva
                        // });
                        if (idIva) {
                            currentRecord.setCurrentSublistValue({
                                sublistId: "recmachcustrecord_ft_lcap_tranrelres",
                                fieldId: "custrecord_ft_lcap_codivares",// se inserta el codigo de iva
                                line: q,
                                value: idIva
                            });
                        
                            currentRecord.setCurrentSublistValue({
                                sublistId: "recmachcustrecord_ft_lcap_tranrelres",
                                fieldId: "custrecord_ft_lcap_tarivares",
                                line: q,
                                value: (rateIva + "%")
                            });
                        
                            // log.audit({
                            //     title: "AQUI",
                            //     details: 5
                            // })
                            currentRecord.setCurrentSublistValue({
                                sublistId: "recmachcustrecord_ft_lcap_tranrelres",
                                fieldId: "custrecord_ft_lcap_valivares",//valor de iva
                                line: q,
                                value: totalImpIva
                            });
                        }
                        // log.audit({
                        //     title: "totalImpIva",
                        //     details: totalImpIva
                        // })
                        if (idRetefuente) {
                            currentRecord.setCurrentSublistValue({
                                sublistId: "recmachcustrecord_ft_lcap_tranrelres",
                                fieldId: "custrecord_ft_lcap_codrtfteres",
                                line: q,
                                value: idRetefuente
                            });
                        }
                        // log.audit({
                        //     title: "AQUI",
                        //     details: 7
                        // })
                        if (rateRtfte) {
                            currentRecord.setCurrentSublistValue({
                                sublistId: "recmachcustrecord_ft_lcap_tranrelres",
                                fieldId: "custrecord_ft_lcap_tarrtfteres",
                                line: q,
                                value: (rateRtfte + "%")
                            });
                            currentRecord.setCurrentSublistValue({
                                sublistId: "recmachcustrecord_ft_lcap_tranrelres",
                                fieldId: "custrecord_ft_lcap_valrtfteres",
                                line: q,
                                value: totalImpRtf
                            });
                        }
                        // log.audit({
                        //     title: "AQUI",
                        //     details: 8
                        // })
                        if (idRtiva) {
                            currentRecord.setCurrentSublistValue({
                                sublistId: "recmachcustrecord_ft_lcap_tranrelres",
                                fieldId: "custrecord_ft_lcap_codrtivares", // mete el codigo de rtiva
                                line: q,
                                value: idRtiva
                            });
                        }
                        // log.audit({
                        //     title: "idRtiva",
                        //     details: idRtiva
                        // })
                        if (rateRtiva) {
                            currentRecord.setCurrentSublistValue({
                                sublistId: "recmachcustrecord_ft_lcap_tranrelres",
                                fieldId: "custrecord_ft_lcap_tarrtivares",
                                line: q,
                                value: (rateRtiva + "%")
                            });
                            currentRecord.setCurrentSublistValue({
                                sublistId: "recmachcustrecord_ft_lcap_tranrelres",
                                fieldId: "custrecord_ft_lcap_valrtivares", //valor de rtiva
                                line: q,
                                value: totalImpRtiva
                            });
                            // log.audit({
                            //     title: "totalImpRtiva",
                            //     details: totalImpRtiva
                            // })
                        }
                        // log.audit({
                        //     title: "RTIVA DONE:",
                        //     details: " RETIVA DONE:"
                        // })
                        if (idIca) {
                            currentRecord.setCurrentSublistValue({
                                sublistId: "recmachcustrecord_ft_lcap_tranrelres",
                                fieldId: "custrecord_ft_lcap_codicares",
                                line: q,
                                value: idIca
                            });
                        }
                        // log.audit({
                        //     title: "ICA DONE:",
                        //     details: " ICA DONE:"
                        // })
                        if (rateIca) {
                            currentRecord.setCurrentSublistValue({
                                sublistId: "recmachcustrecord_ft_lcap_tranrelres",
                                fieldId: "custrecord_ft_lcap_taricares",
                                line: q,
                                value: (rateIca + '%')
                            });
                            currentRecord.setCurrentSublistValue({
                                sublistId: "recmachcustrecord_ft_lcap_tranrelres",
                                fieldId: "custrecord_ft_lcap_valicares",
                                line: q,
                                value: totalImpIca
                            });
                        }
                        // log.audit({
                        //     title: "ICA DONE 1:",
                        //     details: " ICA DONE 1:"
                        // })
                        if (totalImp) {
                            currentRecord.setCurrentSublistValue({
                                sublistId: "recmachcustrecord_ft_lcap_tranrelres",
                                fieldId: "custrecord_ft_lcap_totimpres",
                                line: q,
                                value: totalImp
                            });
                        }
                        // log.audit({
                        //     title: "ICA DONE 2:",
                        //     details: " ICA DONE 2:"
                        // })

                        // window.opener.close();
                        currentRecord.commitLine({ sublistId: "recmachcustrecord_ft_lcap_tranrelres" });


                    }
                    //log.audit({ title: 'totalImp', details: totalImp });
                }
            }

            return true;
        } catch (error) {
            console.log("Error: ", error)
            // log.audit({ title: 'Error al heredar los items', details: error });
        }
    }

    function validateField(context) {

    }

    function fieldChanged(context) {

    }

    function postSourcing(context) {

    }

    function lineInit(context) {

    }

    function validateDelete(context) {

    }

    function validateInsert(context) {

    }

    function validateLine(context) {

    }

    function sublistChanged(context) {

    }

    return {
        // pageInit: pageInit,
        saveRecord: saveRecord,
        // validateField: validateField,
        // fieldChanged: fieldChanged,
        // postSourcing: postSourcing,
        // lineInit: lineInit,
        // validateDelete: validateDelete,
        // validateInsert: validateInsert,
        // validateLine: validateLine,
        // sublistChanged: sublistChanged
    }
});
