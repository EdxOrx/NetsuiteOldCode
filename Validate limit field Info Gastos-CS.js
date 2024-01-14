/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 *@description Script que valida que no supere el total de gastos y compras en la solicitd y reporte de gastos
 */
define(['N/log', 'N/record', 'N/search'], function(log, record,search) {

    function pageInit(context) {
        
        try {
			console.log("INFORME DE GASTOS");
            // var currentRecord = context.currentRecord;
            // var a = currentRecord.getSublistField({sublistId: 'expense', fieldId:'expmediaitem', line: 0});
            // a.isMandatory = true;
            // función que toma los totales de la subtab gastos y los suma
            // var currentRecord = context.currentRecord;
            // var numLinesGastos = currentRecord.getLineCount({ sublistId: 'expense' });
            // var sumaTotal = 0;

            // for(var i = 0; i < numLinesGastos; i++){
            //     var total = currentRecord.getSublistValue({sublistId: 'expense', fieldId:'amount', line: i});
            //      sumaTotal += total;
            // }
            // console.log('sumaTotal', sumaTotal);
            // // función que carga la información del clinete 
            // var idCliente = currentRecord.getValue({fieldId: 'entity'})
            
            // var cliente = record.load({
            //     type: record.Type.EMPLOYEE,
            //     id: idCliente,
            //     isDynamic: true,
            // });
            
            // // var limiteCompra = cliente.getValue({fieldId: 'approvallimit'});
            // var limiteGastos = cliente.getValue({fieldId: 'purchaseorderapprovallimit'});
            // console.log('limiteGastos', limiteGastos);
          
            // if(sumaTotal > limiteGastos){
            //     alert('Valor en gastos supera el límite autorizado, solicite aprobración de su supervisor');
            // }
            
        } catch (error) {
            log.audit({title: 'Error al validar cantidades de cliente',  details: error });
        }
    }

    function saveRecord(context) {

        try {
            var limites = [];
           
            // console.log('limites', limites); 
            var currentRecord = context.currentRecord;
            var tipo = currentRecord.type;
            console.log('tipo', tipo);
              // función que carga la información del cliente 
              var idEmpleado = currentRecord.getValue({fieldId: 'entity'})
              console.log('idEmpleado', idEmpleado);
            // var fieldLookUp = search.lookupFields({
            //     type: search.Type.EMPLOYEE,
            //     id: idCliente,
            //     columns: ['purchaseorderapprovallimit', 'approvallimit']
            // }); 
            // log.audit({ title: 'fieldLookUp', details: JSON.stringify(fieldLookUp) });
              
              var empleado = record.load({
                 type: record.Type.EMPLOYEE,
                  id: idEmpleado,
                  isDynamic: true,
              });
              console.log('empleado', empleado);
              // función que toma los totales de la subtab gastos y los suma
            if(tipo == 'expensereport'){
                console.log('entra a expensereport')
                var numLinesGastos = currentRecord.getLineCount({ sublistId: 'expense' });
                console.log('numLinesGastos', numLinesGastos)
                var sumaTotal = 0;
    
                for(var i = 0; i < numLinesGastos; i++){
                    var total = currentRecord.getSublistValue({sublistId: 'expense', fieldId:'amount', line: i});
                    console.log('total', total)
                    // var total = currentRecord.getSublistValue({sublistId: 'expense', fieldId:'estimatedamount', line: i});
                     sumaTotal += parseFloat(total);
                }
                console.log('sumaTotal', sumaTotal)

               var limiteGastos = empleado.getValue({fieldId: 'purchaseorderapprovallimit'});
               limiteGastos = parseFloat(limiteGastos);
                console.log('limiteGastos', limiteGastos);
          
                if(sumaTotal > limiteGastos){
                   alert('Valor en gastos supera el límite autorizado, solicite aprobración de su supervisor');
                    return false;
                }

            }else if(tipo == 'purchaserequisition'){
                console.log('Entra a purchaserequisition')
                var numLinesGastos = currentRecord.getLineCount({ sublistId: 'expense' });
                // var numLinesGastos = currentRecord.getLineCount({ sublistId: 'item' });
                var sumaTotal = 0;
    
                for(var i = 0; i < numLinesGastos; i++){
                    // var total = currentRecord.getSublistValue({sublistId: 'item', fieldId:'amount', line: i});
                    var total = currentRecord.getSublistValue({sublistId: 'expense', fieldId:'estimatedamount', line: i});
                     sumaTotal += parseFloat(total);
                }
                console.log('sumaTotal', sumaTotal)
                var limiteCompra = empleado.getValue({fieldId: 'approvallimit'});
                console.log('limiteCompra', limiteCompra)
                if(sumaTotal > limiteCompra){
                    alert('Valor en compras supera el límite autorizado, solicite aprobración de su supervisor');
                    return false;
                }
            }
        
            return true;
            
        } catch (error) {
            log.audit({title: 'Error al validar cantidades de cliente',  details: error });
        } finally {
            return true;
        }
        
    }


    function fieldChanged(context) {

        try {
            var currentRecord = context.currentRecord;
            var fieldId = context.fieldId;
            // console.log('fieldId', fieldId);

            // var numLinesGastos = currentRecord.getLineCount({ sublistId: 'expense' });
            
            // for(var i = 0; i < numLinesGastos; i++){
            var archivoAdjunto = currentRecord.getSublistValue({sublistId: 'expense', fieldId:'expmediaitem', line: 0});
            var proveedor = currentRecord.getSublistValue({sublistId: 'expense', fieldId:'receipt', line: 0});
            // console.log('archivoAdjunto', archivoAdjunto);
            // console.log('proveedor', proveedor);
               if(!archivoAdjunto){
                //    console.log('entro a la condición');
                   alert('Debes adjuntar un archivo para continuar')
                   return true;
                   
               }

            // }

        } catch (error) {
            
        }
        
    }

   

    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
        // fieldChanged: fieldChanged,
    }
});
