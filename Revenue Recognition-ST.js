/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/log', 'N/redirect', 'N/runtime'], function(ui, search, log, redirect, runtime) {

    function onRequest(context) {
        try {
            if(context.request.method == 'GET'){
                // log.audit({title: 'context', details: context});
                // los que tengan common cost
                // si un gran inicia en diciembre o en un mes diferente no debe aparecer
                //si un gran ya se venció tampoco debe de aparecer
                // debe de traer por ejemplo si se mete 30 de octubre, debe cargar la información de todo el mes que no esté
                //vencido
                var currentRecord = context.request;
                var infoGrant = [];
                
                var form = ui.createForm({
                    title: 'Revenue Recognition'
                });
                var periodos = [];
                var resultFilter = search.create({
                    type: search.Type.ACCOUNTING_PERIOD,
                    columns: [
                        {name: 'startdate'},
                        {name: 'enddate'},
                        {name: 'periodname'}
                    ]
                });
                var resultData = resultFilter.run();

                var start = 0;
                if(resultData != null){
                    do{
                        var resultSet = resultData.getRange(start, start + 1000);
                            for (var t = 0; t < resultSet.length; t++) {
                                var id = resultSet[t].id;
                                var endDate = resultSet[t].getValue({name: 'startdate'});
                                var startDate = resultSet[t].getValue({name: 'enddate'});
                                var periodName = resultSet[t].getValue({name: 'periodname'});
                                // Pintar solo el año anterior y el año actua, si sale el sig año
                                // también agregarlo. 
                                periodos.push({
                                    id: id,
                                    endDate: endDate,
                                    startDate: startDate,
                                    periodName: periodName,
                                });
                            }   
                            start += 1000;  
                    }while(resultSet && resultSet.length == 1000)
                }  
                // log.audit({ title: 'periodos', details: periodos });
                // Antes de pintar la información, validar el check del record que esté en true
                // Si es así que salga un alert que ya está procesado y no dejar pasar
               
                var periodoManagement = form.addField({
                    id : 'custpage_periodo',
                    type : ui.FieldType.SELECT,
                    label : 'Periodo'
                });

                var date = new Date();
                var anio = date.getFullYear();
                var anio1 = date.getFullYear() - 1;
              
                log.audit({ title: 'anio1', details: anio1 });
              
                for (var period in periodos) {
                    var periodoAnio = periodos[period].periodName;
                    periodoAnio = periodoAnio.substring(4,8)
                    if(periodoAnio >= anio1 && periodoAnio <= anio){
                        periodoManagement.addSelectOption({
                            value: periodos[period].id,
                            text: periodos[period].periodName
                        });        
                    }
                }

                // los 6000 (que son el total de los grant) entre el 100% menos el porcentaje de management fee (información ingresada por usuario).
                // la resta de los porcentajes debe estar en decimales, es decir, si es el 90% debe ser 0.9.
                // formula -> 6000/ 0.9 - 6000 
                // Y el diario se crea con el resultado de la operación de arriba
                // En la nota de el grant se debe ingresar -> management fee + el periodo (oct2020)
                // REalizar vista precia con el grant, periodo e importe y después botón que aplique los journal entries(diarios);

                
                form.addSubmitButton({label: 'Ejecutar Revenue Recognition'});
                form.addResetButton({label: 'LIMPIAR'});

                context.response.writePage(form);

            }else{

                var infoGrant = [];

                var periodo1 = context.request.parameters.custpage_periodo;
                var periodo2 = context.request.parameters.inpt_custpage_periodo;

                // Se carga el record donde se guarda el periodo y una bandera para que no se procese dos veces el mismo
                var dataRecord = [];
                var fechaCorte = search.create({
                    type: 'customrecord_ft_wwfgl_fechacortemf',
                    columns: [
                        {name: 'custrecord_ft_wwfgl_periodomf'},
                        {name: 'custrecord_ft_wwfgl_fechacorte'},
                        {name: 'custrecord_ft_wwfgl_revrecgenerado'}
                    
                    ]
                });

                var resultData = fechaCorte.run();

                var start = 0;
                if(resultData != null){
                    do{
                        var resultSet = resultData.getRange(start, start + 1000);
                            for (var t = 0; t < resultSet.length; t++) {
                                var id = resultSet[t].id;
                                var periodoRecord = resultSet[t].getValue({name: 'custrecord_ft_wwfgl_periodomf'});
                                var periodoText = resultSet[t].getText({name: 'custrecord_ft_wwfgl_periodomf'});
                                var periodo = resultSet[t].getValue({name: 'custrecord_ft_wwfgl_periodomf'});
                                var fechaCorteRecord = resultSet[t].getValue({name: 'custrecord_ft_wwfgl_fechacorte'});
                                var revenueGenerado = resultSet[t].getValue({name: 'custrecord_ft_wwfgl_revrecgenerado'});
                                // Pintar solo el año anterior y el año actua, si sale el sig año
                                // también agregarlo. 
                                dataRecord.push({
                                    id: id,
                                    periodoRecord: periodoRecord,
                                    fechaCorteRecord: fechaCorteRecord,
                                    revenueGenerado: revenueGenerado,
                                    periodoText: periodoText,
                                    periodo: periodo
                                });
                            }   
                            start += 1000;  
                    }while(resultSet && resultSet.length == 1000)
                }  
                log.audit({ title: 'dataRecord', details: dataRecord });

                var sessionObj = runtime.getCurrentSession();
                // Se carga la búsqueda guardada de revenue para tomar los datos por periodo seleccionado
                var revenueRecog = search.load({
                    id: 'customsearch_ft_wwfap_gastosrevrec'
                });

                var MyFilters = search.createFilter({
                    name: 'postingperiod',
                    operator: 'anyof',
                    values: periodo1
                });

                revenueRecog.filters.push(MyFilters);
                var resultData = revenueRecog.run();//.getRange(0, 1000);
                var z = 0;
                var start = 0;
                var hechos = [];
                var hechos1 = [];
                var contineNegativos = false;
                if(dataRecord){
                    
                    // for(var h = 0; h < dataRecord.length; h++){
                    //     var revenueGenerado = dataRecord[h].revenueGenerado;
                    //     var periodoText1 = dataRecord[h].periodo;
                    //     log.audit({ title: 'periodoText1', details: JSON.stringify(periodoText1) });
                    //     log.audit({ title: 'periodo1', details: JSON.stringify(periodo1) });
                       
                    //     if(periodoText1 == periodo1 && revenueGenerado == true){
                           
                    //         context.response.write("<script type='text/javascript'> " +
                    //         "alert('El Periodo ya ha sido procesado'); " +
                    //         "</script>"
                    //         );
                    //         var url = "https://5636634-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=111&deploy=1&compid=5636634_SB1&whence="
                    //         context.response.write("<script type='text/javascript'> " +
                    //         "window.open('"+url+"', '_self') " +
                    //         "</script>"
                    //         );
                   
                    //     }
                    //     else{
                            do{

                                var searchRevenue = resultData.getRange(start, start + 1000);
                                for(z = z; z < searchRevenue.length; z++){
                                    var objRevenue = JSON.parse(JSON.stringify(searchRevenue[z]));
                                    var objDetalleRevenue = objRevenue.values;
                                    log.audit({title: 'OBJDEtalle', details:objRevenue })
    
                                    var tranId = objDetalleRevenue['tranid'];
    
                                    var trandate = objDetalleRevenue['trandate'];

                                    var estructura = objDetalleRevenue["line.cseg_npo_fund_p"].length > 0 ? objDetalleRevenue["line.cseg_npo_fund_p"][0]["value"] : "";
                                  
                                    var arrayPostingPeriod = objDetalleRevenue['postingperiod'];
                                    for(var a = 0; a < arrayPostingPeriod.length; a++){
                                        var idPeriodo = arrayPostingPeriod[a].value;
                                        var textPeriodo = arrayPostingPeriod[a].text;
                                    }
                                    
                                    var arrayType = objDetalleRevenue['type'];
                                    for(var b = 0; b < arrayType.length; b++){
                                        var idTipo = arrayType[b].value;
                                        var textTipo = arrayType[b].text;
                                    }
                                    var arrayEntity = objDetalleRevenue['entity'];
                                    for(var c = 0; c < arrayEntity.length; c++){
                                        var idNombre = arrayEntity[c].value;
                                        var textNombre = arrayEntity[c].text;
                                    }
    
                                    var arrayAccount = objDetalleRevenue['account'];
                                    for(var d = 0; d < arrayAccount.length; d++){
                                        var idCuenta = arrayAccount[d].value;
                                        var textCuenta = arrayAccount[d].value;
                                    }
    
                                    var total = objDetalleRevenue['amount'];
    
                                    var arrayGrant = objDetalleRevenue['line.cseg_npo_grant_segm'];
                                    for(var e = 0; e < arrayGrant.length; e++){
                                        var idGrant = arrayGrant[e].value;
                                        var textGrant = arrayGrant[e].text;
                                    }
    
                                    var arraySubsidiary = objDetalleRevenue['subsidiary'];
                                    for(var f = 0; f < arraySubsidiary.length; f++){
                                        var idSubsidiaria = arraySubsidiary[f].value;
                                        var textSubsidiaria = arraySubsidiary[f].text;
                                    }
    
                                    var arraySponsor = objDetalleRevenue['line.cseg_npo_grant_segm.custrecord_npo_grant_sponsor'];
                                    for(var g = 0; g < arraySponsor.length; g++){
                                        var idDonante = arraySponsor[g].value;
                                        var textDonante = arraySponsor[g].text;
                                    }
    
                                    var arrayLocation = objDetalleRevenue['location'];
                                    for(var k = 0; k < arrayLocation.length; k++){
                                        var idLocation = arrayLocation[k].value;
                                        var textLocation = arrayLocation[k].text;
                                    }


                                    hechos1.push(objRevenue.id);
                                    var nota = objDetalleRevenue['memo'];
                                    // if(hechos.indexOf(objRevenue.id) == -1){
                                        if(parseFloat(total) < 0){
                                            log.audit({
                                                title: "TOTAL: ",
                                                details: total
                                            })
                                            contineNegativos = true;
                                        }
                                        hechos.push(objRevenue.id);
                                        infoGrant.push({
                                            tranId: tranId,
                                            trandate: trandate,
                                            idPeriodo: idPeriodo,
                                            textPeriodo: textPeriodo,
                                            idTipo: idTipo,
                                            textTipo: textTipo,
                                            idNombre: idNombre,
                                            textNombre: textNombre,
                                            idCuenta: idCuenta,
                                            textCuenta: textCuenta,
                                            total: total,
                                            idGrant: idGrant,
                                            textGrant: textGrant,
                                            nota: nota,
                                            idSubsidiaria: idSubsidiaria,
                                            textSubsidiaria: textSubsidiaria,
                                            idDonante: idDonante,
                                            textDonante: textDonante,
                                            idLocation: idLocation,
                                            textLocation: textLocation,
                                            periodo1: periodo1,
                                            estructura: estructura 
                                        });
                                    // }
                                }
                                
                                start += 1000;
                            }while(searchRevenue && searchRevenue.length == 1000)
                        
                            log.audit({
                                title: "HECHOS: ",
                                details: hechos
                            })
                            log.audit({
                                title: "HECHOS 1: ",
                                details: hechos1
                            })
                            log.audit({title: 'infoGrant', details: infoGrant.length});
                            
                            // var sessionObj = runtime.getCurrentSession();
                            
                        // }
                    // }
                    log.audit({
                        title: "EL NUMERO DE CUENTAS ES:",
                        details: infoGrant.length
                    })
                    infoGrant = JSON.stringify(infoGrant)
                    sessionObj.set({  name: "custscript_wwf_data_revenue", value: infoGrant  });
                    
                    var arrayManagement = [];
                    var managementAndRecovery = search.create({
                        type: 'customrecord_ft_wwfgl_fechacortemf',
                        columns: [{ name: 'custrecord_ft_wwfgl_periodomf' }, {name: 'custrecord_ft_wwfgl_mfeegenerado'}],
                        
                    });
                    var mySearch = search.createFilter({
                        name: "custrecord_ft_wwfgl_periodomf",
                        operator: search.Operator.IS,
                        values: periodo1,
                    });
                    managementAndRecovery.filters.push(mySearch);
                    var resultData = managementAndRecovery.run();
                    var start = 0;
                    if (resultData != null) {
                        do {
                            var resultSet = resultData.getRange(start, start + 1000);
                            for (var t = 0; t < resultSet.length; t++) {
                                var id = resultSet[t].id;
                                var managementPeriod = resultSet[t].getValue({
                                    name: 'custrecord_ft_wwfgl_periodomf',
                                });
                                var management = resultSet[t].getValue({
                                    name: 'custrecord_ft_wwfgl_mfeegenerado'
                                })
                                arrayManagement.push({
                                    id: id,
                                    managementPeriod: managementPeriod,
                                    management: management
                                });
                            }
                            start += 1000;
                        } while (resultSet && resultSet.length == 1000);
                    }
                    var commonCostHecho = false;
                    if(arrayManagement.length > 0){
                        for (var i = 0; i < arrayManagement.length; i++) {
                            if(parseInt(arrayManagement[i].managementPeriod) == parseInt(periodo1) && arrayManagement[i].management){
                                commonCostHecho = true;
                                break;
                            }
                        }
                    }
                    if(commonCostHecho){
                        sessionObj.set({
                          name: 'custscript_wwf_mg_managementrr',
                          value: "true"
                        });
                    }else{
                        sessionObj.set({
                            name: 'custscript_wwf_mg_managementrr',
                            value: "false"
                        });
                    }

                    if(contineNegativos){
                        sessionObj.set({
                            name: "custscript_wwf_mg_valoresnegativos",
                            value: "true"
                        })
                    }else{
                        sessionObj.set({
                            name: "custscript_wwf_mg_valoresnegativos",
                            value: "false"
                        })
                    }

                    log.audit({
                        title: "SESSION",
                        details: sessionObj.get({name: "custscript_wwf_data_revenue"})
                    })
                    redirect.toSuitelet({
                        scriptId: 'customscript_wwf_mg_create_pay',
                        deploymentId: 'customdeploy_wwf_mg_create_pay' 
                    });
                }
            }
            // }else{
                
            //     var infoGrant = [];

            //     // var fecha1 = context.request.parameters.custpage_date_inicio;
            //     var fecha = context.request.parameters.custpage_date_fin;
            //     var fecha1 = fecha;

            //     var dia = fecha.substring(3,5);
            //     var mes = fecha.substring(0,2);
            //     var anio = fecha.substring(6,10);
            //     fecha = mes + dia + anio;
            //     log.audit({title: 'fecha', details: fecha});
            //     // log.audit({title: 'fecha1', details: fecha1});
            //     var notDia = fecha1.substring(3,5)
            //     var notMes = fecha1.substring(0,2)
            //     var notAnio = fecha1.substring(6,10)
            //     notDia = '01';
            //     // log.audit({title: 'notDia', details: notDia});
            //     fecha1 = notMes + notDia + notAnio;
               
               
            //     log.audit({title: 'fecha1 fin', details: fecha1});
                
            //     var segmentGrant = search.create({
            //         type: 'customrecord_cseg_npo_grant_segm',
                    
            //         filters : [  
            //             ['custrecord_wwf_mgsl_revenue_recognition', search.Operator.IS, 'T' ]
                       
            //         ],
                    
            //         columns: [
            //             {name: 'name'},
            //             {name: 'custrecord_npo_grant_start_date'},
            //             {name: 'custrecord_npo_grant_sponsor'},
            //             {name: 'custrecord_npo_grant_end_date'},
            //             {name: 'custrecord_wwf_mgsl_common_cost'},
            //             {name: 'custrecord_wwf_mgsl_common'},
            //             {name: 'custrecord_npo_grant_desc'},
            //             {name: 'custrecord_wwf_mg_percent'},
            //             {name: 'custrecord_wwf_mgsl_management'},
            //             {name: 'custrecord_ft_wwfcm_manfee'},
            //         ]
            //     });

            //     var resultData = segmentGrant.run();

            //     var start = 0;
            //     if(resultData != null || resultData != ''){
            //         do{
            //             var resultSet = resultData.getRange(start, start + 1000);
            //             for (var t = 0; t < resultSet.length; t++) {
            //                 var id = resultSet[t].id;
            //                 var name = resultSet[t].getValue({name: 'name'});
            //                 var startDate = resultSet[t].getValue({name: 'custrecord_npo_grant_start_date'});
            //                 var endDate = resultSet[t].getValue({name: 'custrecord_npo_grant_end_date'});
            //                 var endDate1 = resultSet[t].getValue({name: 'custrecord_npo_grant_end_date'});
            //                 var sponsor = resultSet[t].getText({name: 'custrecord_npo_grant_sponsor'});
            //                 var porcentajeCommon = resultSet[t].getValue({name: 'custrecord_wwf_mgsl_common_cost'});
            //                 var common = resultSet[t].getValue({name: 'custrecord_wwf_mgsl_common'});
            //                 var titulo = resultSet[t].getValue({name: 'custrecord_npo_grant_desc'});
            //                 var porcentaje = resultSet[t].getValue({name: 'custrecord_wwf_mg_percent'});
            //                 var management = resultSet[t].getValue({name: 'custrecord_wwf_mgsl_management'});
            //                 var managementPercent = resultSet[t].getValue({name: 'custrecord_ft_wwfcm_manfee'});
                            
            //                 var diaG = endDate.substring(3,5);
            //                 var mesG = endDate.substring(0,2);
            //                 var anioG = endDate.substring(6,10);
            //                 endDate = mesG + diaG + anioG;
            //                 log.audit({title: 'endDate', details: endDate});
            //                 if(endDate >= fecha1  && endDate <= fecha){
            //                     infoGrant.push({
            //                         id: id,
            //                         name: name,
            //                         startDate: startDate,
            //                         endDate1: endDate1,
            //                         sponsor: sponsor,
            //                         porcentajeCommon: porcentajeCommon,
            //                         common: common,
            //                         titulo: titulo,
            //                         porcentaje: porcentaje,
            //                         management: management,
            //                         managementPercent: managementPercent,
            //                     });
            //                 }    
            //             }
            //             start += 1000; 
            //         }while(resultSet && resultSet.length == 1000)
            //     }
            //     log.audit({title: 'infoGrant', details: infoGrant});
            // }
            // if(infoGrant){
            //     infoGrant = JSON.stringify(infoGrant);

            //     redirect.toSuitelet({
            //         scriptId: 'customscript_wwf_mg_create_pay',
            //         deploymentId: 'customdeploy_wwf_mg_create_pay',
            //         parameters: {
            //             'custparam_data': infoGrant
            //         } 
            //     });
            // }

        } catch (error) {
            log.audit({title: 'Error al generar Revenue Recognition', details: error});
        }
    }

    return {
        onRequest: onRequest
    }
});
