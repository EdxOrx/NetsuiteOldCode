/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 *@description Script que carga el grant desde la oportunidad y 
                hereda los datos de las subtab al momento de guarda la transacción
 */
define(['N/record'], function (record) {


    function afterSubmit(context) {
        try {
            var new_record = context.newRecord;

            var grantId = new_record.getValue({ fieldId: 'cseg_npo_grant_segm' });
            if(grantId){

                var grant = record.load({
                    type: 'customrecord_cseg_npo_grant_segm',
                    id: grantId,
                    isDynamic: true,
                });
    
                if (grant) {
                    // // Se toman los valores de las subtab de beneficiarios para enviarlos al grant
                    var numLinesBeneficiarios = new_record.getLineCount({ sublistId: 'recmachcustrecord_ft_wwfcm_benefopor' });
                    if (numLinesBeneficiarios) {
    
                        for (var i = 0; i < numLinesBeneficiarios; i++) {
                            // Se toman los valores de subtab socios subrecord beneficiaros
                            var beneficiario = new_record.getSublistText({ sublistId: 'recmachcustrecord_ft_wwfcm_benefopor', fieldId: 'custrecord_ft_wwfpy_nombenef', line: i })
                            var categoriaBeneficiarios = new_record.getSublistValue({ sublistId: 'recmachcustrecord_ft_wwfcm_benefopor', fieldId: 'custrecord_ft_wwfcm_catbenef', line: i });
                            var numeroBeneficiarios = new_record.getSublistValue({ sublistId: 'recmachcustrecord_ft_wwfcm_benefopor', fieldId: 'custrecord_ft_wwfcm_numbenef', line: i });
    
                            grant.selectNewLine({ sublistId: 'recmachcustrecord_ft_wwfmg_benegrant' });
                            grant.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ft_wwfmg_benegrant', fieldId: 'custrecord_ft_wwfpy_nombenef', line: i, value: beneficiario, ignoreFieldChange: true });
                            grant.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ft_wwfmg_benegrant', fieldId: 'custrecord_ft_wwfcm_catbenef', line: i, value: categoriaBeneficiarios, ignoreFieldChange: true });
                            grant.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ft_wwfmg_benegrant', fieldId: 'custrecord_ft_wwfcm_numbenef', line: i, value: numeroBeneficiarios, ignoreFieldChange: true });
                            grant.commitLine({ sublistId: 'recmachcustrecord_ft_wwfmg_benegrant' });
    
                        }
                    }
    
    
                    // Se toman los valores de las subtab de implementadores para enviarlos al grant
                    var numLinesBeneficiarios = new_record.getLineCount({ sublistId: 'recmachcustrecord_ft_wwf_implementa' });
                    if (numLinesBeneficiarios) {
    
                        for (var l = 0; l < numLinesBeneficiarios; l++) {
                            // Se toman los valores de subtab socios subrecord implementadores
                            var beneficiario = new_record.getSublistText({ sublistId: 'recmachcustrecord_ft_wwf_implementa', fieldId: 'name', line: l })
    
                            grant.selectNewLine({ sublistId: 'recmachcustrecord_ft_wwfmg_implgrant' });
                            grant.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ft_wwfmg_implgrant', fieldId: 'name', line: l, value: beneficiario, ignoreFieldChange: true });
                            grant.commitLine({ sublistId: 'recmachcustrecord_ft_wwfmg_implgrant' });
    
                        }
                    }
    
                    // Se toman los valores de las subtab de donantes para enviarlos al grant
                    var numLinesDonantes = new_record.getLineCount({ sublistId: 'recmachcustrecord_ft_wwfcm_donopo' });
                    if (numLinesDonantes) {
    
                        for (var j = 0; j < numLinesDonantes; j++) {
                            // Se toman los valores de subtab socios subrecord donantes
                            var donante = new_record.getSublistValue({ sublistId: 'recmachcustrecord_ft_wwfcm_donopo', fieldId: 'custrecord_ft_wwfcm_donante', line: j })
    
                            grant.selectNewLine({ sublistId: 'recmachcustrecord_ft_wwfmg_dongrant' });
                            grant.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ft_wwfmg_dongrant', fieldId: 'custrecord_ft_wwfcm_donante', line: j, value: donante, ignoreFieldChange: true });
                            grant.commitLine({ sublistId: 'recmachcustrecord_ft_wwfmg_dongrant' });
    
                        }
                    }
    
                    // Se toman los valores de las subtab de proveedores de info para enviarlos al grant
                    var numLinesProvInfo = new_record.getLineCount({ sublistId: 'recmachcustrecord_ft_wwfcm_provinfoop' });
                    if (numLinesProvInfo) {
    
                        for (var k = 0; k < numLinesProvInfo; k++) {
                            // Se toman los valores de subtab socios subrecord proveedores de info
                            var proveedores = new_record.getSublistText({ sublistId: 'recmachcustrecord_ft_wwfcm_provinfoop', fieldId: 'name', line: k })
    
                            grant.selectNewLine({ sublistId: 'recmachcustrecord_ft_wwfcm_provinfogrant' });
                            grant.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ft_wwfcm_provinfogrant', fieldId: 'name', line: k, value: proveedores, ignoreFieldChange: true, forceSyncSourcing: true });
                            grant.commitLine({ sublistId: 'recmachcustrecord_ft_wwfcm_provinfogrant' });
    
                        }
                    }
    
                    //  Se toman el subrecord outcomes  de plan estrategico
                    var numLinesOutcome = new_record.getLineCount({ sublistId: 'recmachcustrecord_wwf_mgsl_propofull' });
                    if (numLinesOutcome) {
    
                        for (var m = 0; m < numLinesOutcome; m++) {
                            // Se toman los valores de subtab socios subrecord outcomes
                            var outcome = new_record.getSublistValue({ sublistId: 'recmachcustrecord_wwf_mgsl_propofull', fieldId: 'custrecord_ft_wwfcm_outcome', line: m })
                            var porcentajeOutcome = new_record.getSublistText({ sublistId: 'recmachcustrecord_wwf_mgsl_propofull', fieldId: 'custrecord_wwf_mgsl_porcfull', line: m })
    
                            grant.selectNewLine({ sublistId: 'recmachcustrecord_ft_wwfcm_grantrelout' });
                            grant.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ft_wwfcm_grantrelout', fieldId: 'custrecord_ft_wwfcm_outcome', line: m, value: outcome, ignoreFieldChange: true, forceSyncSourcing: true });
                            grant.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ft_wwfcm_grantrelout', fieldId: 'custrecord_wwf_mgsl_porcfull', line: m, value: porcentajeOutcome, ignoreFieldChange: true, forceSyncSourcing: true });
                            grant.commitLine({ sublistId: 'recmachcustrecord_ft_wwfcm_grantrelout' });
    
                        }
                    }
    
                    //  Se toman el subrecord estrategias   de plan estrategico
                    var numLinesEstrategia = new_record.getLineCount({ sublistId: 'recmachcustrecord_wwf_mgsl_planestra' });
                    if (numLinesEstrategia) {
    
                        for (var n = 0; n < numLinesEstrategia; n++) {
                            // Se toman los valores de subtab socios subrecord estrategia
                            var estrategia = new_record.getSublistValue({ sublistId: 'recmachcustrecord_wwf_mgsl_planestra', fieldId: 'custrecord_wwf_mgsl_estrate', line: n })
                            var porcentajeEstrategia = new_record.getSublistText({ sublistId: 'recmachcustrecord_wwf_mgsl_planestra', fieldId: 'custrecord_wwf_mgsl_percen', line: n })
    
                            grant.selectNewLine({ sublistId: 'recmachcustrecord_ft_wwfcm_grantrelestr' });
                            grant.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ft_wwfcm_grantrelestr', fieldId: 'custrecord_wwf_mgsl_estrate', line: n, value: estrategia, ignoreFieldChange: true, forceSyncSourcing: true });
                            grant.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ft_wwfcm_grantrelestr', fieldId: 'custrecord_wwf_mgsl_percen', line: n, value: porcentajeEstrategia, ignoreFieldChange: true, forceSyncSourcing: true });
                            grant.commitLine({ sublistId: 'recmachcustrecord_ft_wwfcm_grantrelestr' });
    
                        }
                    }
    
                    //  Se toman el subrecord equipo de proyecto de relationship
                    var numLinesEstrategia = new_record.getLineCount({ sublistId: 'recmachcustrecord_wwf_mgsl_newconta' });
                    if (numLinesEstrategia) {
    
                        for (var p = 0; p < numLinesEstrategia; p++) {
                            // Se toman los valores de subtab socios subrecord estrategia
                            var empleado = new_record.getSublistValue({ sublistId: 'recmachcustrecord_wwf_mgsl_newconta', fieldId: 'custrecord_wwf_mgsl_contact', line: p })
                            var rol = new_record.getSublistValue({ sublistId: 'recmachcustrecord_wwf_mgsl_newconta', fieldId: 'custrecord_wwf_mgsl_role', line: p })
    
                            grant.selectNewLine({ sublistId: 'recmachcustrecord_ft_wwfcm_newmiemb' });
                            grant.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ft_wwfcm_newmiemb', fieldId: 'custrecord_wwf_mgsl_contact', line: p, value: empleado, ignoreFieldChange: true, forceSyncSourcing: true });
                            grant.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ft_wwfcm_newmiemb', fieldId: 'custrecord_wwf_mgsl_role', line: p, value: rol, ignoreFieldChange: true, forceSyncSourcing: true });
                            grant.commitLine({ sublistId: 'recmachcustrecord_ft_wwfcm_newmiemb' });
    
                        }
                    }
    
                    var numLinesContra = new_record.getLineCount({ sublistId: 'recmachcustrecord_ft_wwfcm_opptranid' });
                    // console.log('numLinesContra', numLinesContra);
                    if (numLinesContra) {
    
                        for (var r = 0; r < numLinesContra; r++) {
                            var fuentes = new_record.getSublistValue({ sublistId: 'recmachcustrecord_ft_wwfcm_opptranid', fieldId: 'custrecord_npo_sc_constituent', line: r });
                            var amount = new_record.getSublistValue({ sublistId: 'recmachcustrecord_ft_wwfcm_opptranid', fieldId: 'custrecord_npo_sc_amount', line: r });
                            var categoria = new_record.getSublistValue({ sublistId: 'recmachcustrecord_ft_wwfcm_opptranid', fieldId: 'custrecord_wwf_mgop_cat', line: r });
                            var grant = new_record.getSublistValue({ sublistId: 'recmachcustrecord_ft_wwfcm_opptranid', fieldId: 'custrecord_ft_wwfpy_grantsoft', line: r });
    
                            grant.selectNewLine({ sublistId: 'recmachcustrecord_wwf_mgsl_grasof' });
                            grant.setCurrentSublistValue({ sublistId: 'recmachcustrecord_wwf_mgsl_grasof', fieldId: 'custrecord_npo_sc_constituent', line: r, value: fuentes, forceSyncSourcing: true });
                            grant.setCurrentSublistValue({ sublistId: 'recmachcustrecord_wwf_mgsl_grasof', fieldId: 'custrecord_npo_sc_amount', line: r, value: amount, forceSyncSourcing: true });
                            grant.setCurrentSublistValue({ sublistId: 'recmachcustrecord_wwf_mgsl_grasof', fieldId: 'custrecord_wwf_mgop_cat', line: r, value: categoria, forceSyncSourcing: true });
                            grant.setCurrentSublistValue({ sublistId: 'recmachcustrecord_wwf_mgsl_grasof', fieldId: 'custrecord_ft_wwfpy_grantsoft', line: r, value: grant, forceSyncSourcing: true });
                            grant.commitLine({ sublistId: 'recmachcustrecord_wwf_mgsl_grasof' });
                        }
                    }
    
                    var numLinesDepCiu = new_record.getLineCount({ sublistId: 'recmachcustrecord_ft_wwfpy_optreldpto' });
                    // console.log('numLinesDepCiu', numLinesDepCiu)
                    if (numLinesDepCiu) {
                        for (var z = 0; z < numLinesDepCiu; z++) {
                            var ciudad = new_record.getSublistValue({ sublistId: 'recmachcustrecord_ft_wwfpy_optreldpto', fieldId: 'custrecord_ft_wwfpy_ciudad', line: z, forceSyncSourcing: true });
                            var depto = new_record.getSublistValue({ sublistId: 'recmachcustrecord_ft_wwfpy_optreldpto', fieldId: 'custrecord_ft_wwfpy_depto', line: z, forceSyncSourcing: true });
                            log.audit({title: 'ciudad', details: ciudad}) 
                            log.audit({title: 'depto', details: depto}) 
    
                            grant.selectNewLine({ sublistId: 'recmachcustrecord_ft_wwfpy_grantreldpto' });
                            grant.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ft_wwfpy_grantreldpto', fieldId: 'custrecord_ft_wwfpy_depto', line: z, value: depto, forceSyncSourcing: true });
                            grant.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ft_wwfpy_grantreldpto', fieldId: 'custrecord_ft_wwfpy_ciudad', line: z, value: ciudad, forceSyncSourcing: true });
                            // grant.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ft_wwfpy_grantreldpto', fieldId: 'custrecord_ft_wwfpy_ciudad', line: z, value: 2, forceSyncSourcing: true });
                            // grant.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ft_wwfpy_grantreldpto', fieldId: 'custrecord_ft_wwfpy_depto', line: z, value: depto, forceSyncSourcing: true });
                            grant.commitLine({ sublistId: 'recmachcustrecord_ft_wwfpy_grantreldpto' });
                        }
                    }
                    var idSaveGrant = grant.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                }
                log.audit({ title: 'idSaveGrant', details: idSaveGrant })
            }

        } catch (error) {
            log.audit({ title: 'Error al enviar datos al grant de subtab', details: error })
        }
    }

    return {
        afterSubmit: afterSubmit
    }
});
