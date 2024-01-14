/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/search', 'N/record', 'N/format', 'N/runtime'], function (currentRecord, search, record, format, runtime) {
    var metafinal;
    var userId;
  
    // De la pestaña de outcomes, tomar los outcomes y sacar la información de indicadores y esta información meterla en la subtab
    //indicadores plan estrategico y bloquear el campo de indicador y ponerle la opción de eliminar y esto de debe de hacer al guardar 
    // y debe de mandar un popup que le de instrucciones de validar la información completa de la subtab.
    // Si ya tiene información que no meta nada y si no tiene información que meta todo lo que hay en outcomes.
    // 
    // Si hay outcomes sacar la información
    function calculateCurrentTrimester(year, month){
        var trimesters = [];
        var trimesterBelong = {};
        var monthInitTrimester = 0;
        if(parseInt(month) < 10){
            month = "0"+month;
        }
        for(var i = 1; i < 5 ; i++){
            monthInitTrimester = (i-1)*3;
            if(monthInitTrimester < 10){
                monthInitTrimester = "0"+monthInitTrimester.toString();
            }
            if(i>1){
                monthInitTrimester = parseInt(monthInitTrimester) + 1;
                if(monthInitTrimester < 10){
                    monthInitTrimester = "0"+monthInitTrimester.toString();
                }
            }
            trimesters.push({
                start: year+(i == 1 ? "0"+1 : monthInitTrimester),
                finished: year+(((i*3) < 10) ? "0"+(i*3) : (i*3)),
                monthInit: (i == 1 ? "0"+1 : monthInitTrimester),
                monthEnd: ((i*3) < 10) ? "0"+(i*3) : ""+(i*3)
            });
        }
    
        if(parseFloat(month) <= 3){
            trimesterBelong = {
                start: trimesters[0].start,
                finished: trimesters[0].finished
            };
        }else if(parseFloat(month) <= 6){
            trimesterBelong = {
                start: trimesters[1].start,
                finished: trimesters[1].finished
            };
        }else if(parseFloat(month) <= 9){
            trimesterBelong = {
                start: trimesters[2].start,
                finished: trimesters[2].finished
            };
        }else{
            trimesterBelong = {
                start: trimesters[3].start,
                finished: trimesters[3].finished
            };
        }
        return  trimesterBelong;
    }
    function getCurrentTrimesterText(trimester) {
        var start = (trimester.start).substring(4,6);
        var text = "";
        var year = (trimester.start).substring(0,4)
        console.log(start, year)
        if(start == "01"){
            text = "1 Trimestre "+year
        }else if(start == "04"){
            text = "2 Trimestre "+year
        }else if(start == "07"){
            text = "3 Trimestre "+year
        }else if(start == "10"){
            text = "4 Trimestre "+year
        }
        return text
    }
    

    function pageInit(context) {
        try {
            // Se toma el id del usuario 
            // var userObj = runtime.getCurrentUser();
            // userId = userObj.id;
            // console.log('userId', userId);
            var currentRecord = context.currentRecord
            var parent = currentRecord.getField({ fieldId: 'parent' });
            currentRecord.getField({ fieldId: 'plannedwork' }).isDisabled = true;;
            currentRecord.setValue({ fieldId: 'plannedwork', value: 0 });
            trimestrePorReportar = currentRecord.getValue({fieldId: 'custevent_ft_wwfpy_trimrep'});
            currentRecord.setValue({fieldId: "constrainttype", value: "ASAP" })

            
                

            //ESTABLECE EL TRIMESTRE ACTUAL
            var fechaActual = new Date();
            var actualMes = fechaActual.getMonth();
            var actualYear = fechaActual.getFullYear();
            var currentTrimiestre = calculateCurrentTrimester(actualYear, actualMes);
            var arrayFechasTrimestres = [];
            var arrayFechasTrimestres1 = [];
            var resultFilter = search.create({
                type: 'customrecord_ft_wwfpy_fechrepmon',
                columns: [
                    { name: 'custrecord_ft_wwfpy_initrim' },
                    { name: 'custrecord_ft_wwfpy_fechlimrep' },
                    { name: 'name' },
                    { name: 'lastmodifiedby' },
                ]
            });

            var resultData = resultFilter.run();
            var start = 0;
            var currentTrimestreId = 0;
            if (resultData != null) {
                do {
                    var resultSet = resultData.getRange(start, start + 1000);
                    console.log(resultSet);
                    for (var t = 0; t < resultSet.length; t++) {
                        var id = resultSet[t].id;
                        var fechaInicioTrimestre = resultSet[t].getValue({ name: 'custrecord_ft_wwfpy_initrim' });
                        var fechaLimiteReporte = resultSet[t].getValue({ name: 'custrecord_ft_wwfpy_fechlimrep' });
                        var name = resultSet[t].getValue({ name: 'name' });
                        var idUsuario = resultSet[t].getValue({ name: 'lastmodifiedby' });
                        var diaIni = fechaInicioTrimestre.split('/')[0];
                        if(diaIni < 10){
                            diaIni = "0"+diaIni;
                        }
                        var mesIni = fechaInicioTrimestre.split('/')[1];
                        if(mesIni < 10){
                            mesIni = "0"+mesIni;
                        }
                        var anioIni = fechaInicioTrimestre.split('/')[2];

                        var diaFin = fechaLimiteReporte.split('/')[0];
                        if(diaFin < 10){
                            diaFin = "0"+diaFin;
                        }
                        var mesFin = fechaLimiteReporte.split('/')[1];
                        if(mesFin < 10){
                            mesFin = "0"+mesFin;
                        }
                        var anioFin = fechaLimiteReporte.split('/')[2];

                        var fechaIni = anioIni + mesIni + diaIni; //fecha inicio trimestre
                        var fechaFin = anioFin + mesFin + diaFin;//fecha fin trimestre
                        // fechaFin = parseInt(fechaFin);
                        // fechaIni = parseInt(fechaIni);
                        // if (fechaIni >= fechaActual)
                        // currentTrimiestre
                        console.log("PAGE INIT")
                        console.log(parseFloat(anioIni+mesIni), parseFloat(anioFin+mesFin) )
                        console.log(parseFloat(anioIni+mesIni) == (currentTrimiestre.start), parseFloat(anioFin+mesFin) == (currentTrimiestre.finished) )
                        if (parseFloat(anioIni+mesIni) == (currentTrimiestre.start)  && parseFloat(anioFin+mesFin) == (currentTrimiestre.finished) ) {
                            arrayFechasTrimestres1.push({
                                name: name
                            })
                            arrayFechasTrimestres.push({
                                id: id,
                                fechaIni: fechaIni,
                                fechaFin: fechaFin,
                                name: name
                            });
                            currentRecord.setValue({fieldId: 'custevent_ft_wwfpy_trimplan', value: id})
                            currentTrimestreId = id;
                            break;
                        }
                        
                        // }
                    }
                    start += 1000;
                } while (resultSet && resultSet.length == 1000)
            }

            var userObj = runtime.getCurrentUser();
            var userName = userObj.name;
            var userRol = userObj.roleId;
            console.log("userObj:", userObj,
                "userName:", userName,
                "userRol:", userRol)
            var recordId = context.currentRecord.getValue({ fieldId: 'company' });
            var proyecto = record.load({
                type: record.Type.JOB,
                id: recordId
            })
            var nameProjectManager = proyecto.getText({ fieldId: 'projectmanager' });


            // var nivel = currentRecord.getValue('custevent_wwf_mg_nivel');
            var nivel = currentRecord.getValue({ fieldId: 'custevent_wwf_mg_nivel' });
            console.log("NIVEL ::::", nivel)
            if (!nivel) {
                currentRecord.getField({ fieldId: 'custevent_wwf_mg_indicadores' }).isVisible = false;
            }
            if (nivel) {
                if( userName == nameProjectManager){
                    currentRecord.getField({fieldId: 'custevent_ft_wwfpy_avanesptrim'}).isMandatory = true;
                    currentRecord.getField({fieldId: 'custevent_ft_wwfpy_trimplan' }).isMandatory = true;
                }
                if (nivel == 4) {
                    // if(parent){
                    currentRecord.getField({ fieldId: 'custevent_wwf_mg_indicadores' }).isVisible = true;
                    // }
                }
            }else{
                currentRecord.getField({fieldId: 'custevent_ft_wwfpy_avanesptrim'}).isMandatory = false;
                currentRecord.getField({fieldId: 'custevent_wwf_mg_avance_esp' }).isMandatory = false;
                currentRecord.getField({fieldId: 'custevent_ft_wwfpy_evireq' }).isMandatory = false;
                currentRecord.getField({fieldId: 'custevent_ft_wwfpy_trimplan' }).isMandatory = false;

                currentRecord.getField({fieldId: 'custevent_ft_wwfpy_avanesptrim'}).isDisabled = true;
                currentRecord.getField({fieldId: 'custevent_wwf_mg_avance_esp' }).isDisabled = true;
                currentRecord.getField({fieldId: 'custevent_ft_wwfpy_evireq' }).isDisabled = true;
                currentRecord.getField({fieldId: 'custevent_ft_wwfpy_trimplan' }).isDisabled = true;
            }

            
            
            var numLinesAssignees = currentRecord.getLineCount({ sublistId: 'assignee' });
            console.log('numLinesAssignees', numLinesAssignees)
            if (numLinesAssignees) {
                for (var i = 0; i < numLinesAssignees; i++) {
                    var responsable = currentRecord.getSublistValue({ sublistId: 'assignee', fieldId: 'resource', line: i });
                    var responsable1 = currentRecord.getSublistText({ sublistId: 'assignee', fieldId: 'resource', line: i });
                    if (responsable1 == userName) {
                        currentRecord.getField({ fieldId: 'custevent_ft_wwfpy_trimrep' }).isVisible = true;
                        currentRecord.getField({ fieldId: 'custevent_ft_wwfpy_obstrim' }).isVisible = true;
                        currentRecord.getField({ fieldId: 'custevent_ft_wwfpy_avanrealtrim' }).isVisible = true;
                        currentRecord.getField({ fieldId: 'custevent_wwf_mg_avance_meta' }).isVisible = true;

                    } else {
                        currentRecord.getField({ fieldId: 'custevent_ft_wwfpy_trimrep' }).isVisible = false;
                        currentRecord.getField({ fieldId: 'custevent_ft_wwfpy_obstrim' }).isVisible = false;
                        currentRecord.getField({ fieldId: 'custevent_ft_wwfpy_avanrealtrim' }).isVisible = false;
                        currentRecord.getField({ fieldId: 'custevent_wwf_mg_avance_meta' }).isVisible = false;

                    }
                }
            }


            var numLines = currentRecord.getLineCount({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro' });
            console.log("NUM LINES", numLines);
            // var idSublista = currentRecord.getSublistValue({sublistId: 'assignee', fieldId: 'resource', line: i});
            // if(currentTrimestreId == idSublista){
            // }


            
            var currentTrimesterText = getCurrentTrimesterText(currentTrimiestre)
            for (var i = 0; i < numLines; i++) {
                var avanceAcum = currentRecord.getSublistValue({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro', fieldId: 'custrecord_wwf_mg_avance_esp_pro', line: i });
                var avanceMeta = currentRecord.getSublistValue({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro', fieldId: 'custrecord_wwf_mg_avance_meta_pro', line: i });
                var avanceMetaTrim = currentRecord.getSublistValue({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro', fieldId: 'custrecord_wwf_mg_avance_meta_pro', line: i });
                var trimePlaneado = currentRecord.getSublistText({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro', fieldId: 'custrecord_wwf_mg_trim_plan_pro', line: i });
                var evidRequerida = currentRecord.getSublistValue({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro', fieldId: 'custrecord_wwf_mg_acciones_req_pro', line: i });
                var idTrimPLan = currentRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro',
                    fieldId: "custrecord_wwf_mg_trim_plan_pro",
                    line: i
                })
                console.log(currentTrimestreId, idTrimPLan)
                if(currentTrimestreId == idTrimPLan){
                    currentRecord.setValue({fieldId: 'custevent_ft_wwfpy_avanesptrim', value: avanceAcum});
                    currentRecord.setValue({fieldId: 'custevent_wwf_mg_avance_esp', value:avanceMeta })
                    currentRecord.setValue({fieldId: 'custevent_ft_wwfpy_evireq', value:evidRequerida })
                    console.log("AVANCE: ", avanceAcum, "AVANCEMETA: ", avanceMeta, "AVANCCE METRA TRIM: ", avanceMetaTrim, "TRIM PLANEADO", trimePlaneado, "EVID REQUERDINA: ", evidRequerida)
                }
// Agregar trimestre en el reporte de indicar proyecto.
                
                var trimester = currentRecord.getSublistText({
                    sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro',
                    fieldId: 'custrecord_wwf_mg_trim_plan_pro',
                    line: i
                })
                
                if(trimester == currentTrimesterText){
                    var accionesRequeridas = currentRecord.getSublistValue({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro', fieldId: 'custrecord_wwf_mg_acciones_req_pro', line: i });
                    var trimesterId = currentRecord.getSublistValue({
                        sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro',
                        fieldId: 'custrecord_wwf_mg_trim_plan_pro',
                        line: i
                    })
                    log.audit({
                        title: "TRIMESTRE ID:",
                        details: trimesterId
                    })
                    currentRecord.setValue({ fieldId: 'custevent_wwf_mg_avance_esp', value: avanceMeta });
                    currentRecord.setValue({ fieldId: 'custevent_ft_wwfpy_avanesptrim', value: avanceAcum });
                    currentRecord.setValue({ fieldId: 'custevent_ft_wwfpy_trimplan', value: trimesterId });
                    currentRecord.setValue({ fieldId: 'custevent_ft_wwfpy_evireq', value: accionesRequeridas });
                }

            }
            
            

            // Fracción donde oculta notas del manager
            console.log('nivel', nivel);
            if (nameProjectManager == userName) {
                console.log("MANAGER");
                currentRecord.getField({ fieldId: 'custevent_ft_wwfpy_avanesptrim' }).isVisible = true;
                currentRecord.getField({ fieldId: 'custevent_ft_wwfpy_trimplan' }).isVisible = true;
                currentRecord.getField({ fieldId: 'custevent_wwf_mg_avance_esp' }).isVisible = true;
                currentRecord.getField({ fieldId: 'custevent_ft_wwfpy_evireq' }).isVisible = true;
                // currentRecord.getField({ fieldId: 'custevent_wwf_mg_eviden_req_pro' }).isVisible = true;
                // var name = currentRecord.getField({ fieldId: 'title' });
                // name.isDisabled = true;
            } else {
                console.log("NO ES MANAGER");
                var avance = currentRecord.getField({ fieldId: 'custevent_ft_wwfpy_avanesptrim' })
                var trimplan = currentRecord.getField({ fieldId: 'custevent_ft_wwfpy_trimplan' })
                var avanceEsp = currentRecord.getField({ fieldId: 'custevent_wwf_mg_avance_esp' })
                var evideReq = currentRecord.getField({ fieldId: 'custevent_ft_wwfpy_evireq' })
                avance.isDisabled = true;
                trimplan.isDisabled = true;
                avanceEsp.isDisabled = true;
                evideReq.isDisabled = true;
                avance.isMandatory = false;
                trimplan.isMandatory = false;
                avanceEsp.isMandatory = false;
                evideReq.isMandatory = false;

                var avanRealTrim = currentRecord.getField({ fieldId: 'custevent_ft_wwfpy_avanrealtrim' });
                var obserSemes = currentRecord.getField({ fieldId: 'custevent_ft_wwfpy_obstrim' });
                var avanceMeta = currentRecord.getField({ fieldId: 'custevent_wwf_mg_avance_meta' });
                // avanRealTrim.isDisabled = true;
                // obserSemes.isDisabled = true;
                // avanceMeta.isDisabled = true;
                // currentRecord.getField({ fieldId: 'custevent_wwf_mg_eviden_req_pro' }).isVisible = false;
            }


            // var numLines = currentRecord.getLineCount({sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro'});
            // console.log('numLines', numLines);
            // for(var i = 0; i < numLines; i++){
            //     var test = currentRecord.getSublistValue({sublistId:'recmachcustrecord_wwf_mg_plan_ind_pro', fieldId: 'custrecord_wwf_mg_acciones_req_pro', line: i});
            //     console.log('test', test);
            //     currentRecord.selectNewLine({sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro'});
            //     currentRecord.setCurrentSublistValue({ sublistId:'recmachcustrecord_wwf_mg_plan_ind_pro', fieldId: 'custrecord_wwf_mg_acciones_req_pro', value: '', line: i});
            //     currentRecord.setCurrentSublistValue({ sublistId:'recmachcustrecord_wwf_mg_plan_ind_pro', fieldId: 'custrecord_wwf_mg_avance_esp_pro', value: '', line: i});
            //     currentRecord.setCurrentSublistValue({ sublistId:'recmachcustrecord_wwf_mg_plan_ind_pro', fieldId: 'custrecord_wwf_mg_avance_meta_pro', value: '', line: i});
            //     currentRecord.commitLine({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro'});

            // }
            // var indicadores = currentRecord.getField({ fieldId: 'custevent_wwf_mg_indicadores'});
            // indicadores.isDisabled = false;
        } catch (error) {
            log.audit({
                title: "ERROR:",
                details: error
            })
            console.log('error al hacer obligatorio el campo', error)
        }
    }

    
    
    function saveRecord(context) {
        try {
            var currentRecord = context.currentRecord
            var fechaActual = new Date();
            var actualMes = fechaActual.getMonth();
            var actualYear = fechaActual.getFullYear();
            if(actualMes < 10){
                actualMes = "0"+actualMes;
            }
            var currentTrimiestre = calculateCurrentTrimester(actualYear, actualMes);
            console.log(currentTrimiestre)
            // calcula las fechas de los trimestres 
            var arrayFechasTrimestres = [];
            var arrayFechasTrimestres1 = [];
            // Se carga la lista de trimestres
            var resultFilter = search.create({
                type: 'customrecord_ft_wwfpy_fechrepmon',
                columns: [
                    { name: 'custrecord_ft_wwfpy_initrim' },
                    { name: 'custrecord_ft_wwfpy_fechlimrep' },
                    { name: 'name' },
                    { name: 'lastmodifiedby' },
                ]
            });
            log.audit({
                title: "CONTEXTO   :0-----------------",
                details: context.currentRecord.getValue({fieldId: 'custevent_ft_wwfpy_avanesptrim'})
            })
            var resultData = resultFilter.run();
            var start = 0;
            if (resultData != null) {
                do {
                    var resultSet = resultData.getRange(start, start + 1000);
                    console.log(resultSet);
                    for (var t = 0; t < resultSet.length; t++) {
                        var id = resultSet[t].id;
                        var fechaInicioTrimestre = resultSet[t].getValue({ name: 'custrecord_ft_wwfpy_initrim' });
                        var fechaLimiteReporte = resultSet[t].getValue({ name: 'custrecord_ft_wwfpy_fechlimrep' });
                        var name = resultSet[t].getValue({ name: 'name' });
                        var idUsuario = resultSet[t].getValue({ name: 'lastmodifiedby' });
                        var diaIni = fechaInicioTrimestre.split('/')[0];
                        if(diaIni < 10){
                            diaIni = "0"+diaIni;
                        }
                        var mesIni = fechaInicioTrimestre.split('/')[1];
                        if(mesIni < 10){
                            mesIni = "0"+mesIni;
                        }
                        var anioIni = fechaInicioTrimestre.split('/')[2];

                        var diaFin = fechaLimiteReporte.split('/')[0];
                        if(diaFin < 10){
                            diaFin = "0"+diaFin;
                        }
                        var mesFin = fechaLimiteReporte.split('/')[1];
                        if(mesFin < 10){
                            mesFin = "0"+mesFin;
                        }
                        var anioFin = fechaLimiteReporte.split('/')[2];

                        var fechaIni = anioIni + mesIni + diaIni; //fecha inicio trimestre
                        var fechaFin = anioFin + mesFin + diaFin;//fecha fin trimestre
                        // fechaFin = parseInt(fechaFin);
                        // fechaIni = parseInt(fechaIni);
                        // if (fechaIni >= fechaActual)
                        // currentTrimiestre
                        console.log(parseFloat(anioIni+mesIni), parseFloat(anioFin+mesFin) )
                        console.log(parseFloat(anioIni+mesIni) == (currentTrimiestre.start), parseFloat(anioFin+mesFin) == (currentTrimiestre.finished) )
                        if (parseFloat(anioIni+mesIni) == (currentTrimiestre.start)  && parseFloat(anioFin+mesFin) == (currentTrimiestre.finished) ) {
                            arrayFechasTrimestres1.push({
                                name: name
                            })
                            arrayFechasTrimestres.push({
                                id: id,
                                fechaIni: fechaIni,
                                fechaFin: fechaFin,
                                name: name
                            });
                            break;
                        }
                        
                        // }
                    }
                    start += 1000;
                } while (resultSet && resultSet.length == 1000)
            }
            console.log("ARRAY TRIMESTRE1:",arrayFechasTrimestres1);
            console.log("ARRAY TRIMESTRE:",arrayFechasTrimestres);
            log.audit({ title: 'arrayFechasTrimestresSave save record', details: arrayFechasTrimestres });
            // log.audit({ title: 'arrayFechasTrimestres1 save record', details: arrayFechasTrimestresSave});
            // console.log('arrayFechasTrimestres', arrayFechasTrimestres)
            // console.log('arrayFechasTrimestres123', arrayFechasTrimestres1)







        
            log.audit({
                title: "METASSSSSSSSSSSSSSSSs",
                details: JSON.stringify({
                    avanceRepMeta: currentRecord.getValue({ fieldId: 'custevent_ft_wwfpy_avanrealtrim' }),
                    avanceRealGestion: currentRecord.getValue({ fieldId: 'custevent_wwf_mg_avance_meta' })
                })
            })
            var numLinesIndica = currentRecord.getLineCount({
                sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro'
            });
            var estaVacioIndicadores = false;

            for (var i = 0; i < numLinesIndica; i++) {
                var trimPlan = currentRecord.getSublistValue({sublistId: "recmachcustrecord_wwf_mg_plan_ind_pro",fieldId: "custrecord_wwf_mg_trim_plan_pro", line: i})         
                var planInd = currentRecord.getSublistValue({sublistId: "recmachcustrecord_wwf_mg_plan_ind_pro",fieldId: "custrecord_wwf_mg_plan_ind_pro", line: i})         
                var metaPro = currentRecord.getSublistValue({sublistId: "recmachcustrecord_wwf_mg_plan_ind_pro",fieldId: "custrecord_wwf_mg_avance_meta_pro", line: i})         
                var espPro = currentRecord.getSublistValue({sublistId: "recmachcustrecord_wwf_mg_plan_ind_pro",fieldId: "custrecord_wwf_mg_avance_esp_pro", line: i})         
                var reqPro = currentRecord.getSublistValue({sublistId: "recmachcustrecord_wwf_mg_plan_ind_pro",fieldId: "custrecord_wwf_mg_acciones_req_pro", line: i})  
  
                trimPlan = trimPlan.trim();
                planInd = planInd.trim();
                metaPro = metaPro.trim();
                reqPro = reqPro.trim();
                
                if(!trimPlan &&
                    !planInd &&
                    !metaPro &&
                    !espPro &&
                    !reqPro){
                        estaVacioIndicadores = true;
                        break;
                    }
            }
            if(estaVacioIndicadores){
                alert("Debe de llenar todos los campos de los indicadores para poder guardar.");
                return false;
            }
            var numLinesAssignee = currentRecord.getLineCount({
                sublistId: 'assignee'
            })

            log.audit({title: "NUMLINES:", details: numLinesAssignee});
            var tieneAssignee = false;
            if(numLinesAssignee > 0){
                for(var i = 0 ; i < numLinesAssignee ; i++){
                    var assignee = currentRecord.getSublistValue({sublistId: 'assignee' ,fieldId: 'resource', line: i})
                    if(assignee.trim()){
                        log.audit({title: "TIENE ASSIgNEE:", details: assignee})
                        tieneAssignee = true;
                        break;
                    }
                }
                if(!tieneAssignee){
                    var nivel = currentRecord.getValue({fieldId: 'custevent_wwf_mg_nivel'});
                    log.audit({title: "NIVEL: ", details: nivel});
                    if(nivel == 4 || nivel == 5){
                        alert("Debe de agregar al menos un responsable");
                        return false;
                    }
                }
            }else{
                var nivel = currentRecord.getValue({fieldId: 'custevent_wwf_mg_nivel'});
                log.audit({title: "NIVEL: ", details: nivel});
                if(nivel == 4 || nivel == 5){

                    alert("Debe de agregar al menos un responsable");
                    return false;
                }
            }

            var nivel = currentRecord.getValue({ fieldId: 'custevent_wwf_mg_nivel' });
            var name = currentRecord.getValue({ fieldId: 'title' });
            var consecutivo = currentRecord.getValue({ fieldId: 'custevent_wwf_mg_consecutivo' });
            if (!consecutivo) {
                consecutivo = 1;
            }
            var concatenado = nivel + parseInt(consecutivo) + 1 + ':' + name;
            log.audit({
                title: "ELEMENTOS: ",
                details: JSON.stringify({
                    nivel: nivel,
                    name: name,
                    consecutivo: consecutivo,
                })
            })
            // Fragmento de codigo que hereda el proyecto al indicador.
            var idIndicador = currentRecord.getValue({ fieldId: 'custevent_wwf_mg_indicadores' });

            log.audit({
                title: "INDICADOR:",
                details: idIndicador
            })
            var recordIndicador = record.load({
                type: 'customrecord_wwf_mg_indicador',
                id: idIndicador,
                isDynamic: true,
            });
            log.audit({
                title: "CARGA RECORD INDICADOR PRIMERA VEZ:",
                details: idIndicador
            })
            var metaFinal1 = recordIndicador.getValue({fieldId: 'custrecord_wwf_mg_meta_final'});
            var numLines = currentRecord.getLineCount({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro' });

            var trimestreAlGuardar =  currentRecord.getValue({fieldId: 'custevent_ft_wwfpy_trimrep'})
            console.log('numLinesTRIMESTRES', numLines);
            // && trimestrePorReportar !== trimestreAlGuardar
            if (numLines ) {



                var idTrimNotesManager = currentRecord.getValue({fieldId: 'custevent_ft_wwfpy_trimplan'});
                
                if(parseInt(idTrimNotesManager) > 0){
                    var numLinesPLanIndicadores = currentRecord.getLineCount({
                        sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro'
                    });
                    console.log(numLinesPLanIndicadores)
                    for (var i = 0; i < numLinesPLanIndicadores; i++) {
                        currentRecord.selectLine({
                            sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro',
                            line: i
                        })
                        var idTrimPlanIndicador = currentRecord.getCurrentSublistValue({
                            sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro',
                            fieldId: 'custrecord_wwf_mg_trim_plan_pro',
                            line: i
                        })
                        console.log("idTrimNotesManager",idTrimNotesManager,
                            "idTrimPlanIndicador", idTrimPlanIndicador)
                        
                        if(parseInt(idTrimNotesManager) == parseInt(idTrimPlanIndicador)){
                            console.log("TRUE: ",idTrimNotesManager, idTrimPlanIndicador)
                            var avanceProyectoGestion = currentRecord.getValue({
                                fieldId: 'custevent_ft_wwfpy_avanesptrim'
                            });
                            console.log("avanceProyectoGestion",avanceProyectoGestion);
                            currentRecord.setCurrentSublistValue({sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro' , fieldId: 'custrecord_wwf_mg_avance_esp_pro', value: parseFloat(avanceProyectoGestion)})
                            var avanceEsperadoMeta = currentRecord.getValue({
                                fieldId: 'custevent_wwf_mg_avance_esp'
                            });
                            console.log("avanceEsperadoMeta",avanceEsperadoMeta);
                            currentRecord.setCurrentSublistValue({sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro' , fieldId: 'custrecord_wwf_mg_avance_meta_pro', value: parseFloat(avanceEsperadoMeta)})
                            var accionesReqSopAvan = currentRecord.getValue({
                                fieldId: 'custevent_ft_wwfpy_evireq'
                            });
                            console.log("accionesReqSopAvan",accionesReqSopAvan);
                            currentRecord.setCurrentSublistValue({sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro' , fieldId: 'custrecord_wwf_mg_acciones_req_pro', value: accionesReqSopAvan})
                            console.log(
                                "avanceProyectoGestion",avanceProyectoGestion,
                                "avanceEsperadoMeta",avanceEsperadoMeta,
                                "accionesReqSopAvan", accionesReqSopAvan                                )
                        }
                        currentRecord.commitLine({
                            sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro',
                            ignoreRecalc: true
                        });
                    }
                }



                var arrayTrim = [];

                var totalMetaTrim = 0;
                var arrayValues = [];
                var meta = 0;
                for (var i = 0; i < numLines; i++) {
                    var avanceAcum = currentRecord.getSublistValue({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro', fieldId: 'custrecord_wwf_mg_avance_esp_pro', line: i });
                    var avanceMeta = currentRecord.getSublistValue({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro', fieldId: 'custrecord_wwf_mg_avance_meta_pro', line: i });
                    var avanceMetaTrim = currentRecord.getSublistValue({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro', fieldId: 'custrecord_wwf_mg_avance_meta_pro', line: i });
                    var trimePlaneado = currentRecord.getSublistText({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro', fieldId: 'custrecord_wwf_mg_trim_plan_pro', line: i });
                    var evidRequerida = currentRecord.getSublistValue({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro', fieldId: 'custrecord_wwf_mg_acciones_req_pro', line: i });
                    avanceMetaTrim = parseInt(avanceMetaTrim);
                    totalMetaTrim += avanceMetaTrim;
                    console.log("AVANCE: ", avanceAcum, "AVANCEMETA: ", avanceMeta, "AVANCCE METRA TRIM: ", avanceMetaTrim, "TRIM PLANEADO", "EVID REQUERDINA: ", eviRequerida)
                    arrayTrim.push({
                        avanceAcum: avanceAcum,
                        avanceMeta: avanceMeta,
                        trimePlaneado: trimePlaneado,
                        evidRequerida: evidRequerida,
                    });
                    avanceAcum = parseInt(avanceAcum);
                    if(avanceAcum){
                        arrayValues.push(avanceAcum);
                    }else{
                        arrayValues.push(0);
                    }
                    meta += parseFloat(avanceMeta);
                }
                console.log('totalMetaTrim', totalMetaTrim)
                console.log('metaFinal1', metaFinal1)
                console.log("ARRRAY VALUES: ", arrayValues)
                // if(arrayValues.indexOf(0) == -1 && arrayValues.indexOf(100) == -1){
                //     alert('El avance esperado de la gestion, no debe superar la Meta del indicador ')
                //     return false;
                // }
                console.log("TRECORD INDICADOR", recordIndicador)
                var numLinesRecordIndicador = recordIndicador.getLineCount({sublistId: "recmachcustrecord_ft_wwfpy_indicadorperepind"});
                console.log("Num lines record indicador", numLinesRecordIndicador)
                var metaIndicadorTotal = 0;
                if(numLinesRecordIndicador > 0){
                    for (var i = 0; i < numLinesRecordIndicador; i++) {
                        var metaIndicador = recordIndicador.getSublistValue({sublistId: 'recmachcustrecord_ft_wwfpy_indicadorperepind', fieldId: 'custrecord_ft_wwfpy_valrepmetrepind', line: i})
                        metaIndicadorTotal += parseFloat(metaIndicador)
                    }
                }
                console.log("METAS> ",meta, metaFinal1)
                if((meta+metaIndicadorTotal) > metaFinal1){
                    alert('La meta final del indicador tiene un total de: '+metaIndicadorTotal+', pero el limite es: '+meta+' el Id del indicador es: '+recordIndicador.id)
                    return false;
                }
                // if (totalMetaTrim > metaFinal1) {
                //     alert('El avance esperado Meta, no debe superar la Meta del indicador ')
                //     return false;
                // }

                console.log('arrayTrim', arrayTrim);
                var infoHeredar = [];
                var infoHeredar1 = [];
                // var numeLines = currentRecord.getLineCount({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro' });
                // for (var j = 0; j < numLines; j++) {
                //     var avanceAcum = currentRecord.getSublistValue({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro', fieldId: 'custrecord_wwf_mg_avance_esp_pro', line: j });
                //     var avanceMeta = currentRecord.getSublistValue({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro', fieldId: 'custrecord_wwf_mg_avance_meta_pro', line: j });
                //     var trimePlaneado = currentRecord.getSublistValue({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro', fieldId: 'custrecord_wwf_mg_trim_plan_pro', line: j });
                //     var evidRequerida = currentRecord.getSublistValue({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro', fieldId: 'custrecord_wwf_mg_acciones_req_pro', line: j });
                console.log('fechaActual', fechaActual)
                for (var l = 0; l < arrayFechasTrimestres.length; l++) {
                    var fechaIni = arrayFechasTrimestres[l].fechaIni;
                    var fechaFin = arrayFechasTrimestres[l].fechaFin;
                    var id = arrayFechasTrimestres[l].id;
                    var name = arrayFechasTrimestres[l].name;
                    fechaIni = parseInt(fechaIni);
                    fechaFin = parseInt(fechaFin);
                    // console.log('fechaIni', fechaIni)
                    // console.log('fechaFin', fechaFin)
                    // if (fechaIni >= fechaActual && fechaActual <= fechaFin) {
                    if (fechaActual >= fechaIni && fechaActual <= fechaFin) {
                        // if (fechaIni >= fechaActual) {
                        infoHeredar.push({
                            id: id,
                            name: name,
                        });
                    }
                }
                log.audit({ title: 'infoHeredar', details: infoHeredar });
                console.log('infoHeredar', infoHeredar)
                var trimPlaneado;
                var avanceAculumadoTrim1;
                var avanceMetaTrim1;
                var eviRequerida;
                var idTrim;
                if (infoHeredar != '') {
                    for (var k = 0; k < infoHeredar.length; k++) {
                        var nombre = infoHeredar[k].name;
                        // var idTrim = infoHeredar[k].id;
                        console.log('idTrim', idTrim)
                        for (var m = 0; m < arrayTrim.length; m++) {
                            if (nombre == arrayTrim[m].trimePlaneado) {
                                trimPlaneado = arrayTrim[m].trimePlaneado
                                avanceAculumadoTrim1 = arrayTrim[m].avanceAcum
                                avanceMetaTrim1 = arrayTrim[m].avanceMeta
                                eviRequerida = arrayTrim[m].evidRequerida
                                idTrim = infoHeredar[k].id;
                            }
                        }
                    }
                }
                // console.log('infoHeredar', infoHeredar);
                // var avanceAculumadoTrim1 = currentRecord.getSublistValue({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro', fieldId: 'custrecord_wwf_mg_avance_esp_pro', line: 0 });
                // var avanceMetaTrim1 = currentRecord.getSublistValue({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro', fieldId: 'custrecord_wwf_mg_avance_meta_pro', line: 0 });
                // var trimPlaneado = currentRecord.getSublistValue({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro', fieldId: 'custrecord_wwf_mg_trim_plan_pro', line: 0 });
                // // var eviRequerida = currentRecord.getSublistValue({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro', fieldId: 'custrecord_wwf_mg_acciones_req_pro', line: 0 });
                // console.log('idTrim234234239823', idTrim)
                // console.log('avanceAculumadoTrim1', avanceAculumadoTrim1)
                // console.log('avanceMetaTrim1', avanceMetaTrim1)
                // console.log('eviRequerida', eviRequerida)
                if (idTrim) {
                    console.log('entra al idtrim')
                    currentRecord.setValue({ fieldId: 'custevent_ft_wwfpy_trimplan', value: idTrim });
                }
                if (avanceAculumadoTrim1) {
                    console.log('entra al avanceAculumadoTrim1')
                    currentRecord.setValue({ fieldId: 'custevent_ft_wwfpy_avanesptrim', value: avanceAculumadoTrim1 });
                }
                if (avanceMetaTrim1) {
                    console.log('entra al avanceMetaTrim1')
                    currentRecord.setValue({ fieldId: 'custevent_wwf_mg_avance_esp', value: avanceMetaTrim1 });
                }
                if (eviRequerida) {
                    console.log('entra al eviRequerida')
                    currentRecord.setValue({ fieldId: 'custevent_ft_wwfpy_evireq', value: eviRequerida });
                }

                
                // log.audit({ title: 'idIndicador', details: idIndicador });
                // console.log('idIndicador', idIndicador)
                if (recordIndicador) {
                    // console.log('Entra a que si hay indicardor')
                    log.audit({ title: 'Entra a que si hay indicardor', details: 'Entra a que si hay indicardor' });
                    
                    var numLinesSub = recordIndicador.getLineCount({ sublistId: 'recmachcustrecord_ft_wwfpy_indicadorperepind'});
                    log.audit({
                        title: "NUMLINES SUB",
                        details: numLinesSub
                    })
                    var infoTrimestre = {existeTrimestre: false, posicionExistencia: 0};
                    var trimestrePorReportar = currentRecord.getValue({fieldId: 'custevent_ft_wwfpy_trimrep'})
                    log.audit({
                        title: "TRIMESTRE POR REPORTAR",
                        details: trimestrePorReportar
                    })
                    var trimestreSublist = 0;
                    var avanceRepMeta = currentRecord.getValue({ fieldId: 'custevent_ft_wwfpy_avanrealtrim' });
                    var avanceRealGestion = currentRecord.getValue({ fieldId: 'custevent_wwf_mg_avance_meta' });
                    var idProyecto = currentRecord.getValue({ fieldId: 'company' });
                    var idTrans = currentRecord.id;
                    if(numLinesSub > 0){
                        for(var k = 0; k < numLinesSub ; k++){
                            trimestreSublist = recordIndicador.getSublistValue({sublistId: 'recmachcustrecord_ft_wwfpy_indicadorperepind', fieldId: 'custrecord_trimestre', line:k});
                            if(trimestrePorReportar == trimestreSublist){
                                infoTrimestre.existeTrimestre = true;
                                infoTrimestre.posicionExistencia = k;
                                break;
                            }
                        }
                        log.audit({
                            title: "EXISTE EL TRIMESTRE: ",
                            details: infoTrimestre
                        })
                       
                       
                        
                        log.audit({ title: 'avanceRepMeta', details: avanceRepMeta });
                        log.audit({ title: 'avanceRealGestion', details: avanceRealGestion });
                        log.audit({ title: 'idProyecto', details: idProyecto });
                        // var idProyecto = currentRecord.getValue({ fieldId: 'company' });
                        // console.log('idProyecto herencia', idProyecto);
    
                        
                        if(infoTrimestre.existeTrimestre){
                            recordIndicador.selectLine({ sublistId: 'recmachcustrecord_ft_wwfpy_indicadorperepind', line: infoTrimestre.posicionExistencia });
                            recordIndicador.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ft_wwfpy_indicadorperepind', fieldId: 'custrecord_ft_wwfpy_proyectorel', value: idProyecto, line: infoTrimestre.posicionExistencia });
                            recordIndicador.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ft_wwfpy_indicadorperepind', fieldId: 'custrecord_wwf_mg_avance_real', value: avanceRepMeta, line: infoTrimestre.posicionExistencia });
                            recordIndicador.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ft_wwfpy_indicadorperepind', fieldId: 'custrecord_ft_wwfpy_valrepmetrepind', value: avanceRealGestion, line: infoTrimestre.posicionExistencia });
                            recordIndicador.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ft_wwfpy_indicadorperepind', fieldId: 'custrecord_ft_wwfcrm_tareaproyrepind', value: idTrans, line: infoTrimestre.posicionExistencia })
                            recordIndicador.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ft_wwfpy_indicadorperepind', fieldId: 'custrecord_trimestre', value: trimestrePorReportar, line: infoTrimestre.posicionExistencia })
                            recordIndicador.commitLine({ sublistId: 'recmachcustrecord_ft_wwfpy_indicadorperepind' });
    
                        }else{
    
                            recordIndicador.selectNewLine({ sublistId: 'recmachcustrecord_ft_wwfpy_indicadorperepind' });
                            recordIndicador.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ft_wwfpy_indicadorperepind', fieldId: 'custrecord_ft_wwfpy_proyectorel', value: idProyecto, line: 0 });
                            recordIndicador.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ft_wwfpy_indicadorperepind', fieldId: 'custrecord_wwf_mg_avance_real', value: avanceRepMeta, line: 0 });
                            recordIndicador.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ft_wwfpy_indicadorperepind', fieldId: 'custrecord_ft_wwfpy_valrepmetrepind', value: avanceRealGestion, line: 0 });
                            recordIndicador.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ft_wwfpy_indicadorperepind', fieldId: 'custrecord_ft_wwfcrm_tareaproyrepind', value: idTrans, line: 0 })
                            recordIndicador.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ft_wwfpy_indicadorperepind', fieldId: 'custrecord_trimestre', value: trimestrePorReportar, line: 0 })
                            recordIndicador.commitLine({ sublistId: 'recmachcustrecord_ft_wwfpy_indicadorperepind' });
                        }
                    }else{
                        recordIndicador.selectNewLine({ sublistId: 'recmachcustrecord_ft_wwfpy_indicadorperepind' });
                        recordIndicador.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ft_wwfpy_indicadorperepind', fieldId: 'custrecord_ft_wwfpy_proyectorel', value: idProyecto, line: 0 });
                        recordIndicador.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ft_wwfpy_indicadorperepind', fieldId: 'custrecord_wwf_mg_avance_real', value: avanceRepMeta, line: 0 });
                        recordIndicador.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ft_wwfpy_indicadorperepind', fieldId: 'custrecord_ft_wwfpy_valrepmetrepind', value: avanceRealGestion, line: 0 });
                        recordIndicador.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ft_wwfpy_indicadorperepind', fieldId: 'custrecord_ft_wwfcrm_tareaproyrepind', value: idTrans, line: 0 })
                        recordIndicador.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ft_wwfpy_indicadorperepind', fieldId: 'custrecord_trimestre', value: trimestrePorReportar, line: 0 })
                        recordIndicador.commitLine({ sublistId: 'recmachcustrecord_ft_wwfpy_indicadorperepind' });
                    }
                    log.audit({ title: 'recordIndicador', details: recordIndicador });

                    // var saveIndicador = recordIndicador.save({
                    //     enableSourcing: true,
                    //     ignoreMandatoryFields: true
                    // });
                    // log.audit({
                    //     title: "GUARDA RECORD INDICADOR PRIMERA VEZ:",
                    //     details: saveIndicador
                    // })
                    
                    // log.audit({ title: 'saveIndicador', details: saveIndicador });
                    // console.log('saveIndicador', saveIndicador);

                }
                var saveIndicador = idIndicador
                if(saveIndicador){

                    // var recordIndicador = record.load({
                    //     type: 'customrecord_wwf_mg_indicador',
                    //     id: saveIndicador,
                    //     isDynamic: true,
                    // });
                    log.audit({
                        title: "CARGA RECORD INDICADOR SEGUNDA VEZ:",
                        details: recordIndicador
                    })
                    var sumaPuntaje = 0;
                    var formulas = recordIndicador.getValue({ fieldId: 'custrecord_wwf_mg_formulas' });
                    var numLinesPro = recordIndicador.getLineCount({ sublistId: 'recmachcustrecord_ft_wwfpy_indicadorperepind' });
                    var numLinesPE = recordIndicador.getLineCount({ sublistId: 'recmachcustrecord_ft_wwfpy_indicadorperepindpe' });
                    var numLines;
                    if(numLinesPro){
                        numLines = numLinesPro
                    }else{
                        numLines = numLinesPE
                    }
                    if (formulas == 1) {
                        var avanceReportadoMeta = 0;
                        var avanceTempSum = 0 ;

                        var avanceRealGestion = 0;
                        var avanceTempReal = 0;
                        if(numLines){

                            for (var i = 0; i < numLines; i++) {
                                avanceTempSum = recordIndicador.getSublistValue({ sublistId: 'recmachcustrecord_ft_wwfpy_indicadorperepind', fieldId: 'custrecord_ft_wwfpy_valrepmetrepind', line: i }) || 0;
                                // log.audit({title: 'puntaje', details: puntaje });
                                avanceReportadoMeta += parseFloat(avanceTempSum);
                                
                                avanceTempReal = recordIndicador.getSublistValue({sublistId: 'recmachcustrecord_ft_wwfpy_indicadorperepind', fieldId: 'custrecord_wwf_mg_avance_real', line: i}) || 0;
                                avanceRealGestion += parseFloat(avanceTempReal)
                            }
                            // log.audit({title: 'sumaPuntaje', details: sumaPuntaje });
                            console.log("AVANCE MET:", avanceReportadoMeta, " AVANCE TEMP REAL", avanceRealGestion)
                            recordIndicador.setValue({ fieldId: 'custrecord_wwf_mg_valor_global_pro', value: avanceReportadoMeta });
                            recordIndicador.setValue({ fieldId: 'custrecordww_mg_avance_real', value: avanceRealGestion });
                            console.log(recordIndicador.getValue({ fieldId: 'custrecord_wwf_mg_valor_global_pro'}));
                            console.log(recordIndicador.getValue({ fieldId: 'custrecordww_mg_avance_real'}));
                        }
                    } else if (formulas == 2) {
                        var arrayFechas = [];
                        var arrayFechas1 = [];
                        if(numLines){

                            for (var j = 0; j < numLines; j++) {
                                var idProyecto = recordIndicador.getSublistValue({ sublistId: 'recmachcustrecord_ft_wwfpy_indicadorperepind', fieldId: 'id', line: j });
                                var puntajeUltimo = recordIndicador.getSublistValue({ sublistId: 'recmachcustrecord_ft_wwfpy_indicadorperepind', fieldId: 'custrecord_ft_wwfpy_valrepmetrepind', line: j }) || 0;
                                var reporte = record.load({
                                    type: 'customrecord_ft_wwfpy_repindicador',
                                    id: idProyecto,
                                    isDynamic: true,
                                });
                                var fecha = reporte.getText({ fieldId: 'lastmodified' });
                                var newFecha = fecha.split(" ")[0];
                                var dia = newFecha.split("/")[0];
                                var mes = newFecha.split("/")[1];
                                var anio = newFecha.split("/")[2];
                                dia.length == 1 ? dia="0"+dia : dia;  
                                var fechaFin = anio + mes + dia;
                                console.log("UTIMO PUNTAJE",puntajeUltimo)
                                arrayFechas1.push(fechaFin);
                                arrayFechas.push({
                                    fechaFin: fechaFin,
                                    idProyecto: idProyecto,
                                    puntajeUltimo: puntajeUltimo
                                });
                            }
                            console.log('arrayFechas', arrayFechas);
                        }
                        var fechasOrdenadas = arrayFechas1.sort();
                        var fechasOrdenadas1 = fechasOrdenadas[fechasOrdenadas.length - 1];
                        console.log('fechasOrdenadas1', fechasOrdenadas1);
                        for (var a = 0; a < arrayFechas.length; a++) {
                            var fechaFin1 = arrayFechas[a].fechaFin;
                            console.log('fechaFin1', fechaFin1);
                            if (fechaFin1 == fechasOrdenadas1) {
                                console.log('arrayFechas[a].puntajeUltimo', arrayFechas[a].puntajeUltimo);
                                recordIndicador.setValue({ fieldId: 'custrecord_wwf_mg_valor_global_pro', value: arrayFechas[a].puntajeUltimo });
                            }
                        }

                        console.log('fechasOrdenadas', fechasOrdenadas);
                    }

                    var saveNewIndicador = recordIndicador.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    log.audit({
                        title: "GUARDA RECORD INDICADOR SEGUNDA VEZ:",
                        details: saveNewIndicador
                    })
                    console.log('saveNewIndicador', saveNewIndicador);
                }
            }
        } catch (error) {
            log.audit({ title: 'Error al guardar el record', details: error });
            console.log('error al salvar transacción', error)
        }
        return true;
    }


    function fieldChanged(context) {
        try {
            var currentRecord = context.currentRecord
            var fieldId = context.fieldId;
            console.log("FIELD: change", fieldId)
            // var trimestrePlaneado = currentRecord.getValue({ fieldId: 'custevent_ft_wwfpy_trimplan' });
            // console.log("TRIMISTRE PLANEADO",trimestrePlaneado);
            
            if(fieldId == "resource"){
                currentRecord.setCurrentSublistValue({
                    sublistId: 'assignee',
                    fieldId: 'plannedwork',
                    value: 0
                })
            }
            
            if (fieldId == 'custevent_wwf_mg_nivel') {
                var nivel = currentRecord.getValue({ fieldId: 'custevent_wwf_mg_nivel' });
                console.log('nivel', nivel);
                var indicador = currentRecord.getField({fieldId: 'custevent_wwf_mg_indicadores'});
                indicador.isMandatory = true;
                if (nivel == 4 || nivel == 5) {
                    currentRecord.getField({ fieldId: 'custevent_ft_wwfpy_avanesptrim' }).isMandatory = true;
                    currentRecord.getField({ fieldId: 'custevent_ft_wwfpy_trimplan' }).isMandatory = true;
                }else{
                    currentRecord.getField({ fieldId: 'custevent_ft_wwfpy_avanesptrim' }).isMandatory = false;
                    currentRecord.getField({ fieldId: 'custevent_ft_wwfpy_trimplan' }).isMandatory = false;
                }
                if (nivel == 4) {
                    currentRecord.getField({ fieldId: 'custevent_ft_wwfpy_avanesptrim' }).isVisible = true;
                    currentRecord.getField({ fieldId: 'custevent_ft_wwfpy_trimplan' }).isVisible = true;
                    currentRecord.getField({ fieldId: 'custevent_wwf_mg_avance_esp' }).isVisible = true;
                    currentRecord.getField({ fieldId: 'custevent_ft_wwfpy_evireq' }).isVisible = true;
                    // currentRecord.getField({ fieldId: 'custevent_wwf_mg_eviden_req_pro' }).isVisible = true;
                    var name = currentRecord.getField({ fieldId: 'title' });
                    name.isDisabled = true;
                    
                    currentRecord.getField({fieldId: 'custevent_ft_wwfpy_trimrep'}).isVisible = true;
                    currentRecord.getField({fieldId: 'custevent_ft_wwfpy_obstrim'}).isVisible = true;
                    currentRecord.getField({fieldId: 'custevent_ft_wwfpy_avanrealtrim'}).isVisible = true;
                    currentRecord.getField({fieldId: 'custevent_wwf_mg_avance_meta'}).isVisible = true;
                }else if(nivel == 5){
                    currentRecord.getField({fieldId: 'custevent_wwf_mg_avance_meta'}).isVisible = false;
                    currentRecord.getField({fieldId: 'custevent_ft_wwfpy_avanrealtrim'}).isVisible = false;
                    currentRecord.getField({ fieldId: 'custevent_ft_wwfpy_avanesptrim' }).isVisible = false;
                    currentRecord.getField({ fieldId: 'custevent_ft_wwfpy_trimplan' }).isVisible = false;
                    currentRecord.getField({ fieldId: 'custevent_wwf_mg_avance_esp' }).isVisible = false;
                    currentRecord.getField({ fieldId: 'custevent_ft_wwfpy_evireq' }).isVisible = false;
                }else if (nivel != 4 || nivel != 5) {

                    var avance = currentRecord.getField({ fieldId: 'custevent_ft_wwfpy_avanesptrim' })
                    var trimplan = currentRecord.getField({ fieldId: 'custevent_ft_wwfpy_trimplan' })
                    var avanceEsp = currentRecord.getField({ fieldId: 'custevent_wwf_mg_avance_esp' })
                    var evideReq = currentRecord.getField({ fieldId: 'custevent_ft_wwfpy_evireq' })
                    var name = currentRecord.getField({ fieldId: 'title' });
                    name.isDisabled = false;
                    avance.isVisible = false;
                    trimplan.isVisible = false;
                    avanceEsp.isVisible = false;
                    evideReq.isVisible = false;
                    avance.isMandatory = false;
                    trimplan.isMandatory = false;
                    avanceEsp.isMandatory = false;
                    evideReq.isMandatory = false;
                    currentRecord.getField({fieldId: 'custevent_ft_wwfpy_trimrep'}).isVisible = false;
                    currentRecord.getField({fieldId: 'custevent_ft_wwfpy_obstrim'}).isVisible = false;
                    currentRecord.getField({fieldId: 'custevent_ft_wwfpy_avanrealtrim'}).isVisible = false;
                    currentRecord.getField({fieldId: 'custevent_wwf_mg_avance_meta'}).isVisible = false;
                    // currentRecord.getField({ fieldId: 'custevent_wwf_mg_eviden_req_pro' }).isVisible = false;
                }
            }

            if(fieldId == 'custevent_wwf_mg_nivel'){
                var nivel = currentRecord.getValue({fieldId: 'custevent_wwf_mg_nivel'});
                if(nivel == 5){
                    var avanceRealGestion = currentRecord.getField({fieldId: 'custevent_ft_wwfpy_avanrealtrim'});
                    avanceRealGestion.isVisible = false;
                    var avanceMeta = currentRecord.getField({fieldId: 'custevent_wwf_mg_avance_meta'});
                    avanceMeta.isVisible = false;
                }
            }else{
                var avanceRealGestion = currentRecord.getField({fieldId: 'custevent_ft_wwfpy_avanrealtrim'});
                avanceRealGestion.isVisible = true;
                var avanceMeta = currentRecord.getField({fieldId: 'custevent_wwf_mg_avance_meta'});
                avanceMeta.isVisible = true;
            }
            if (fieldId == 'parent' || fieldId == 'custevent_wwf_mg_nivel') {
                console.log('Entra al parent')
                var parent = currentRecord.getField({ fieldId: 'parent' });
                var parentText = currentRecord.getText({ fieldId: 'parent' });
                var indicadores = currentRecord.getField({ fieldId: 'custevent_wwf_mg_indicadores' });
                var nivel = currentRecord.getValue({ fieldId: 'custevent_wwf_mg_nivel' });
                var parentOutcome = "Outcome";
                var parentOutcome1 = "outcome";
                parentText = JSON.stringify(parentText);
                console.log('parentText', parentText)
                if (parent && nivel == 4) {
                    indicadores.isVisible = true;
                } else {
                    indicadores.isVisible = false;

                }
                // if (parentText.includes(parentOutcome)) {
                //     console.log('si trae outcome');
                // } else if (nivel == 4 && !parentText.includes(parentOutcome)) {
                //     console.log('Entra al nivel 4')
                //     console.log('nivel Entra al nivel 4', nivel)
                // }
            }
            if (fieldId == 'custevent_wwf_mg_indicadores') {
                var indicadores = currentRecord.getText({ fieldId: 'custevent_wwf_mg_indicadores' });

                var numLines = currentRecord.getLineCount({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro' });
                if (numLines) {
                    for (var b = numLines; b > 0; b--) {
                        // log.audit({ title: 'b', details: JSON.stringify(b) });
                        var lineR = b - 1;
                        // log.audit({ title: 'lineR', details: JSON.stringify(lineR) });
                        currentRecord.removeLine({
                            sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro',
                            line: lineR,
                            ignoreRecalc: true
                        });
                    }
                }
                currentRecord.setValue({ fieldId: 'title', value: indicadores });
                console.log('calculoTrimestres', 'calculoTrimestres');
                calculoTrimestres();
            }
            // if (fieldId == 'custevent_wwf_mg_indicadores') {//custevent_wwf_mg_indicadores
            //     console.log('entra a indicadores');
            // }
            // else{
            //     var parent = currentRecord.getField({ fieldId: 'parent'});
            //     parent.isMandatory = false;
            // }
            // if(fieldId == 'custevent_wwf_mg_nivel'){
            // }
            
        } catch (error) {
            console.log('Error al heredar los campos', error);
        }
    }

    function calculoTrimestres() {
        try {
            // Valida los rangos de fechas de los trimestre contra los rangos de fechas de los indicadores
            console.log('Entra a calculoTrimestres');
            log.audit({ title: 'Entra a calculoTrimestres', details: JSON.stringify('entra a calculoTrimestres') });
            // customrecord_ft_wwfpy_fechrepmon
            var record = currentRecord.get();
            var startDate = record.getValue({ fieldId: 'startdate' });
            var indicadores = record.getValue({ fieldId: 'custevent_wwf_mg_indicadores' });
            var arrayIndicadores = [];
            var arrayIndicadores1 = [];

            var resultFilter1 = search.create({
                type: 'customrecord_wwf_mg_indicador',
                filters: [['internalId', search.Operator.IS, indicadores]],
                columns: [
                    { name: 'custrecord_wwf_mg_fecha_ind' },
                    { name: 'custrecord_wwf_mg_fechafin_ind' },
                    { name: 'custrecord_wwf_mg_meta_final' },
                    { name: 'custrecord_wwf_mg_desc_ind' }
                ]
            });

            var resultData1 = resultFilter1.run();

            var start = 0;
            if (resultData1 != null) {
                do {
                    var resultSet1 = resultData1.getRange(start, start + 1000);
                    for (var t = 0; t < resultSet1.length; t++) {
                        var id = resultSet1[t].id;
                        var fechaInicioMedicion = resultSet1[t].getValue({ name: 'custrecord_wwf_mg_fecha_ind' });
                        var fechaFinalizacionMedición = resultSet1[t].getValue({ name: 'custrecord_wwf_mg_fechafin_ind' });
                        var descripcion = resultSet1[t].getValue({ name: 'custrecord_wwf_mg_desc_ind' });
                        metafinal = resultSet1[t].getValue({ name: 'custrecord_wwf_mg_meta_final' });

                        var mesIniMed = fechaInicioMedicion.split("/")[1];
                        // if(mesIniMed <= 9){
                        //     mesIniMed = "0"+mesIniMed;
                        // }
                        var diaIniMed = fechaInicioMedicion.split("/")[0];
                        // if(diaIniMed <= 9){
                        //     diaIniMed = "0"+diaIniMed;
                        // }
                        var anioIniMed = fechaInicioMedicion.split("/")[2];

                        var mesFinRep = fechaFinalizacionMedición.split("/")[1];
                        // if(mesFinRep <= 9){
                        //     mesFinRep = "0"+mesFinRep;
                        // }
                        var diaFinRep = fechaFinalizacionMedición.split("/")[0];
                        // if(diaFinRep <= 9){
                        //     diaFinRep = "0"+diaFinRep;
                        // }
                        var anioFinRep = fechaFinalizacionMedición.split("/")[2];
                        
                        var fechaIniMed = anioIniMed + mesIniMed + diaIniMed;//fecha inicio indicador calculo trimestre
                        var fechaFinMed = anioFinRep + mesFinRep + diaFinRep;//fecha fin indicador calculo trimestre

                        fechaIniMed = parseInt(fechaIniMed);
                        fechaFinMed = parseInt(fechaFinMed);
                        arrayIndicadores1.push({
                            fechaIniMed: fechaIniMed,
                            fechaFinMed: fechaFinMed,
                        })
                        arrayIndicadores.push({
                            id: id,
                            fechaInicioMedicion: fechaInicioMedicion,
                            fechaFinalizacionMedición: fechaFinalizacionMedición,
                            fechaIniMed: fechaIniMed,
                            fechaFinMed: fechaFinMed,
                            descripcion: descripcion
                        });
                    }
                    start += 1000;
                } while (resultSet && resultSet.length == 1000)
            }
            log.audit({ title: 'arrayIndicadores', details: arrayIndicadores });
            log.audit({ title: 'arrayIndicadores1', details: arrayIndicadores1 });
            
            // Arboles caidos
            // 2181 id proyecto
            var arrayFechasTrimestres = [];
            var arrayFechasTrimestres1 = [];
            var arrayFechas = [];
            var arrayFechas1 = [];
            // Se carga la lista de trimestres
            var resultFilter = search.create({
                type: 'customrecord_ft_wwfpy_fechrepmon',
                columns: [
                    { name: 'custrecord_ft_wwfpy_initrim' },
                    { name: 'custrecord_ft_wwfpy_fechlimrep' }, //función calculo trimestres
                    { name: 'name' },
                    { name: 'lastmodifiedby' },
                ]
            });

            var resultData = resultFilter.run();

            var start = 0;
            if (resultData != null) {
                do {
                    var resultSet = resultData.getRange(start, start + 1000);
                    for (var t = 0; t < resultSet.length; t++) {
                        var id = resultSet[t].id;
                        var fechaInicioTrimestre = resultSet[t].getValue({ name: 'custrecord_ft_wwfpy_initrim' });
                        var fechaLimiteReporte = resultSet[t].getValue({ name: 'custrecord_ft_wwfpy_fechlimrep' });
                        var name = resultSet[t].getValue({ name: 'name' });
                        var idUsuario = resultSet[t].getValue({ name: 'lastmodifiedby' });

                        var mesIni = fechaInicioTrimestre.split("/")[1];
                        // if(parseInt(mesIni) <=9){
                        //     mesIni = '0'+mesIni;
                        // }
                        var diaIni = fechaInicioTrimestre.split("/")[0];
                        // if(parseInt(diaIni) <=9){
                        //     diaIni = '0'+diaIni;
                        // }
                        var anioIni = fechaInicioTrimestre.split("/")[2];

                        var mesFin = fechaLimiteReporte.split("/")[1];
                        // if(parseInt(mesFin) <=9){
                        //     mesFin = '0'+mesFin;
                        // }
                        var diaFin = fechaLimiteReporte.split("/")[0];
                        // if(parseInt(diaFin) <=9){
                        //     diaFin = '0'+diaFin;
                        // }
                        var anioFin = fechaLimiteReporte.split("/")[2];

                        var fechaIni = anioIni + mesIni + diaIni; //fecha inicio de trimestre calculo trimestre
                        var fechaFin = anioFin + mesFin + diaFin; // fecha fin de trimestre calculo trimestre
                        fechaFin = parseInt(fechaFin);
                        fechaIni = parseInt(fechaIni);
                        arrayFechas1.push({
                            fechaFin: fechaFin,
                            fechaIni: fechaIni
                        });
                        console.log("FECHA FIN: ", fechaFin, "---FECHA FIN:", fechaLimiteReporte, "FECHA MERA: ", fechaIniMed);
                        console.log("FECHA INIT: ", fechaIni, "---FECHA INIT:", fechaInicioTrimestre, "FECHA MERA: ", fechaFinMed);
                        
                        var fechaActual = new Date();
                        var actualMes = fechaActual.getMonth() + 1;
                        var actualYear = fechaActual.getFullYear();
                        if(parseInt(actualMes) <= 9){
                            actualMes = "0"+actualMes.toString();
                        }

                        // Validar las fechas existe error
                        // if(fechaIni >= fechaIniMed){
                        // if(anioIniMed >= anioIni){
                            // if(parseFloat((anioIni+mesIni)) >= parseFloat((anioIniMed+mesIniMed)) && parseFloat((anioFin+mesFin)) <= parseFloat((anioFinRep+mesFinRep))){
                            console.log("ANTES DEL IF : ", (anioIni+mesIni), "--", (anioIniMed+mesIniMed), "El año fin es: ", (anioFin+mesFin), "--", (anioFinRep+mesFinRep), "FECHA ACTUAL ES:",(actualYear+actualMes), "MES ACTUAL:", actualMes, "YEAR ACTUAL:", actualYear)
                            console.log("PRIMERO:",(anioIni+mesIni) >= (anioIniMed+mesIniMed), "SEGUNDO", (anioFin+mesFin) <= (anioFinRep+mesFinRep), "TERCERO: ", parseFloat(anioIni+mesIni) >= parseFloat(actualYear+actualMes), "CUARTO: ", parseFloat(actualYear+actualMes) <= parseFloat(anioFinRep+mesFinRep))
                            console.log("----------------------------------------------")
                            if((parseFloat(anioIni+mesIni) >= parseFloat(anioIniMed+mesIniMed) && parseFloat(anioFin+mesFin) <= parseFloat(anioFinRep+mesFinRep)) ||  (parseFloat(anioIni+mesIni) >= parseFloat(actualYear+actualMes) && parseFloat(actualYear+actualMes) <= parseFloat(anioFinRep+mesFinRep)) || (parseInt(anioIniMed+mesIniMed) == parseInt(anioFinRep+mesFinRep)) || (parseInt(anioIniMed+mesIniMed) >= parseFloat(anioIni+mesIni) && parseInt(anioIniMed+mesIniMed) <= parseFloat(anioFin+mesFin)) ){
                                console.log("El año init es: ", (anioIni+mesIni), "--", (anioIniMed+mesIniMed), "El año fin es: ", (anioFin+mesFin), "--", (anioFinRep+mesFinRep), "FECHA ACTUAL: ",(anioIniMed+mesIniMed) )
                                console.log("PRIMERO:",(anioIni+mesIni) >= (anioIniMed+mesIniMed), "SEGUNDO", (anioFin+mesFin) <= (anioFinRep+mesFinRep), "TERCERO: ", parseFloat(anioIni+mesIni) >= parseFloat(actualYear+actualMes), "CUARTO: ", parseFloat(actualYear+actualMes) <= parseFloat(anioFinRep+mesFinRep))
                            // if(parseFloat(anioIni+mesIni) >= parseFloat(anioIniMed+mesIniMed)){
                                console.log(mesIniMed >= mesFinRep, "MES WORKING: ",mesIniMed,"------------",  mesFinRep);
                                console.log(parseFloat((anioIni+mesIni)) <= parseFloat((anioFin+mesFin)), "ANOS: ",anioIni, "-", mesIni, "::::", anioFin, "-", mesFin);
                                arrayFechasTrimestres1.push({
                                    id: id,
                                    fechaIni: fechaIni,
                                    fechaFin: fechaFin,
                                    fechaInicioTrimestre: fechaInicioTrimestre,
                                    fechaLimiteReporte: fechaLimiteReporte,
                                    name: name
                                });
                                
                            }
                        // }
                        // if (fechaIni > fechaIniMed && fechaFin <= fechaFinMed) {
                        //     arrayFechasTrimestres1.push({
                        //         id: id,
                        //         fechaIni: fechaIni,
                        //         fechaFin: fechaFin,
                        //         fechaInicioTrimestre: fechaInicioTrimestre,
                        //         fechaLimiteReporte: fechaLimiteReporte,
                        //         name: name
                        //     });
                        // }
                    }
                    start += 1000;
                } while (resultSet && resultSet.length == 1000)
            }
            console.log("FECHAS ARRAY TRIMESTRE: ", arrayFechasTrimestres1);
            log.audit({ title: 'arrayFechasTrimestres1', details: arrayFechasTrimestres1 });
            log.audit({ title: 'arrayFechas1', details: arrayFechas1 });
            log.audit({ title: 'arrayFechas', details: arrayFechas });

            for (var z = 0; z < arrayFechasTrimestres1.length; z++) {
                var fechaFin1 = arrayFechasTrimestres1[z]['fechaFin'];
                var id1 = arrayFechasTrimestres1[z]['id'];
                var fechaIni1 = arrayFechasTrimestres1[z]['fechaIni'];
                var fechaInicioTrimestre1 = arrayFechasTrimestres1[z]['fechaInicioTrimestre'];
                var fechaLimiteReporte1 = arrayFechasTrimestres1[z]['fechaLimiteReporte'];
                var name1 = arrayFechasTrimestres1[z]['name'];
                // log.audit({ title: 'fechaFin1', details: fechaFin1 });
                // log.audit({ title: 'fechaFinMed', details: fechaFinMed });
                console.log(fechaFinMed, fechaIni1, fechaIniMed, fechaFin1);
                console.log(fechaFinMed >= fechaIni1 && fechaIniMed <= fechaFin1);
                if (fechaFinMed >= fechaIni1 && fechaIniMed <= fechaFin1) {
                    arrayFechasTrimestres.push({
                        fechaFin1: fechaFin1,
                        id1: id1,
                        fechaIni1: fechaIni1,
                        fechaInicioTrimestre1: fechaInicioTrimestre1,
                        fechaLimiteReporte1: fechaLimiteReporte1,
                        name1: name1,
                    })
                }
            }
            console.log(" arrayFechasTrimestres", arrayFechasTrimestres);
            log.audit({ title: 'arrayFechasTrimestres', details: arrayFechasTrimestres });

            // Se toman las lineas para validar si ya existen en la sublista de planeación de indicadores
            var numLines = record.getLineCount({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro' });
            if (numLines) {
                for (var i = 0; i < numLines; i++) {
                    var trimPlaneado = record.getSublistValue({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro', fieldId: 'custrecord_wwf_mg_trim_plan_pro', line: i });
                    console.log('trimPlaneado', trimPlaneado);
                    for (var b = 0; b < arrayFechasTrimestres.length; b++) {
                        var idTrimestre = arrayFechasTrimestres[b].id1;
                        // console.log('idTrimestre', idTrimestre);
                        if (idTrimestre != trimPlaneado) {
                            record.selectNewLine({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro' });
                            record.setCurrentSublistValue({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro', fieldId: 'custrecord_wwf_mg_trim_plan_pro', value: idTrimestre, line: b })
                            record.commitLine({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro' });
                        }
                    }
                }
            }
            // Se insertan los trimestres en la sublista  planeación de  anindicadores
            for (var c = 0; c < arrayFechasTrimestres.length; c++) {
                var idTrimestre1 = arrayFechasTrimestres[c].id1;
                record.selectNewLine({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro' });
                record.setCurrentSublistValue({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro', fieldId: 'custrecord_wwf_mg_trim_plan_pro', value: idTrimestre1, line: c })
                record.commitLine({ sublistId: 'recmachcustrecord_wwf_mg_plan_ind_pro' });
            }
            
            alert('Complete la información de la pestaña Planeación de indicadores');

        } catch (error) {
            console.log('Error al insertar trimestres', error);
        }
    }

    function sublistChanged(context) {
        console.log("Sublist changed")
    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
        fieldChanged: fieldChanged,
        sublistChanged: sublistChanged
    }
});
//PUNTAJE PRIORIZACION