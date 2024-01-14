/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *@description Script que pinta el formulario de calculo de cierre de mes y filtra por fechas
 */
define(
  ['N/ui/serverWidget', 'N/search', 'N/log', 'N/redirect', 'N/runtime', 'N/email'],
  function (ui, search, log, redirect, runtime, email) {
    function convertMonthText(mesTextBusqueda){
      try {
          if (mesTextBusqueda == 'ene') {
              mesTextBusqueda = '01'
          }
          if (mesTextBusqueda == 'feb') {
              mesTextBusqueda = '02'
          }
          if (mesTextBusqueda == 'mar') {
              mesTextBusqueda = '03'
          }
          if (mesTextBusqueda == 'abr') {
              mesTextBusqueda = '04'
          }
          if (mesTextBusqueda == 'may') {
              mesTextBusqueda = '05'
          }
          if (mesTextBusqueda == 'jun') {
              mesTextBusqueda = '06'
          }
          if (mesTextBusqueda == 'jul') {
              mesTextBusqueda = '07'
          }
          if (mesTextBusqueda == 'ago') {
              mesTextBusqueda = '08'
          }
          if (mesTextBusqueda == 'sep') {
              mesTextBusqueda = '09'
          }
          if (mesTextBusqueda == 'oct') {
              mesTextBusqueda = '10'
          }
          if (mesTextBusqueda == 'nov') {
              mesTextBusqueda = '11'
          }
          if (mesTextBusqueda == 'dic') {
              mesTextBusqueda = '12'
          }
          return mesTextBusqueda;
      } catch (error) {
          
      }
  }
    function onRequest(context) {
      try {
        if (context.request.method == 'GET') {

          var subject_mail = 'Reportes de proyecto completados';
          var body_mail = '\n' + '';
          body_mail += 'Los reportes de trimestres han sido completados. '
          body_mail += '<br /><br />' + 'scheme', 'host', 'output';
          log.audit({ title: 'subject_mail', details: subject_mail });
          log.audit({ title: 'body_mail', details: body_mail });
          // manager
          var senderId = 379
          var recipient = 40
          email.send({
            author: senderId,
            recipients: recipient,
            // recipients: 'miguelcalev@gmail.com',
            // recipients: 40,
            subject: subject_mail,
            body: body_mail
          });
          // log.audit({title: 'context', details: context});
          // los que tengan common cost
          // si un gran inicia en diciembre o en un mes diferente no debe aparecer
          //si un gran ya se venció tampoco debe de aparecer
          // debe de traer por ejemplo si se mete 30 de octubre, debe cargar la información de todo el mes que no esté
          //vencido
          var currentRecord = context.request;
          var infoGrant = [];

          var form = ui.createForm({
            title: 'Management Fee',
          });
          var periodos = [];
          var resultFilter = search.create({
            type: search.Type.ACCOUNTING_PERIOD,
            columns: [
              { name: 'startdate' },
              { name: 'enddate' },
              { name: 'periodname' },
            ],
          });
          var resultData = resultFilter.run();

          var start = 0;
          if (resultData != null) {
            do {
              var resultSet = resultData.getRange(start, start + 1000);
              for (var t = 0; t < resultSet.length; t++) {
                var id = resultSet[t].id;
                var endDate = resultSet[t].getValue({ name: 'startdate' });
                var startDate = resultSet[t].getValue({ name: 'enddate' });
                var periodName = resultSet[t].getValue({ name: 'periodname' });
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
            } while (resultSet && resultSet.length == 1000);
          }
          // log.audit({ title: 'periodos', details: periodos });
          // Antes de pintar la información, validar el check del record que esté en true
          // Si es así que salga un alert que ya está procesado y no dejar pasar

          var periodoManagement = form.addField({
            id: 'custpage_periodo',
            type: ui.FieldType.SELECT,
            label: 'Periodo',
          });

          var date = new Date();
          var anio = date.getFullYear();
          var anio1 = date.getFullYear() - 1;

          log.audit({ title: 'anio1', details: anio1 });

          for (var period in periodos) {
            var periodoAnio = periodos[period].periodName;
            periodoAnio = periodoAnio.substring(4, 8);
            if (periodoAnio >= anio1 && periodoAnio <= anio) {
              periodoManagement.addSelectOption({
                value: periodos[period].id,
                text: periodos[period].periodName,
              });
            }
          }

          // los 6000 (que son el total de los grant) entre el 100% menos el porcentaje de management fee (información ingresada por usuario).
          // la resta de los porcentajes debe estar en decimales, es decir, si es el 90% debe ser 0.9.
          // formula -> 6000/ 0.9 - 6000
          // Y el diario se crea con el resultado de la operación de arriba
          // En la nota de el grant se debe ingresar -> management fee + el periodo (oct2020)
          // REalizar vista precia con el grant, periodo e importe y después botón que aplique los journal entries(diarios);

          form.addSubmitButton({ label: 'Ejecutar Management Fee' });
          form.addResetButton({ label: 'LIMPIAR' });

          context.response.writePage(form);
        } else {
          var infoGrant = [];
          var periodo1 = context.request.parameters.custpage_periodo;
          var periodo2 = context.request.parameters.inpt_custpage_periodo;
          log.audit({ title: 'periodo1', details: periodo1 });
          log.audit({ title: 'periodo2', details: periodo2 });
          var mes = periodo2.split(' ')[0];
          var anio = periodo2.split(' ')[1];
          var mesText = periodo2.split(' ')[0];
          var anioText = periodo2.split(' ')[1];
          var mesText1 = convertMonthText(mesText);
          var anioCompleto = anioText + mesText1;

          if (mes == 'ene') {
            mes = '01';
          }
          if (mes == 'feb') {
            mes = '02';
          }
          if (mes == 'mar') {
            mes = '03';
          }
          if (mes == 'abr') {
            mes = '04';
          }
          if (mes == 'may') {
            mes = '05';
          }
          if (mes == 'jun') {
            mes = '06';
          }
          if (mes == 'jul') {
            mes = '07';
          }
          if (mes == 'ago') {
            mes = '08';
          }
          if (mes == 'sep') {
            mes = '09';
          }
          if (mes == 'oct') {
            mes = '10';
          }
          if (mes == 'nov') {
            mes = '11';
          }
          if (mes == 'dic') {
            mes = '12';
          }

          // Se hace una búsqueda guardada del record para validar fechas de management que ya han sido procesadas
          var dataRecord = [];
          var fechaCorte = search.create({
            type: 'customrecord_ft_wwfgl_fechacortemf',
            columns: [
              { name: 'custrecord_ft_wwfgl_periodomf' },
              { name: 'custrecord_ft_wwfgl_fechacorte' },
              { name: 'custrecord_ft_wwfgl_mfeegenerado' },
              { name: 'custrecord_ft_wwfgl_commoncost' },
            ],
          });

          var managementFee = search.load({
            id: 'customsearch_ft_wwfap_gastosmfeeba',
          });
          var reultManagement = managementFee.run();
          log.audit({
            title: 'dame',
            details: JSON.stringify(reultManagement),
          });
          // Contraseña ->N@vasoftlider
          // rol -> 3
          var resultData = fechaCorte.run();

          var start = 0;
          if (reultManagement != null) {
            do {
              var resultSet = reultManagement.getRange(start, start + 1000);
              for (var t = 0; t < resultSet.length; t++) {
                var id = resultSet[t].id;
                var periodoRecord = resultSet[t].getValue({
                  name: 'custrecord_ft_wwfgl_periodomf',
                });
                var periodoText = resultSet[t].getText({
                  name: 'custrecord_ft_wwfgl_periodomf',
                });
                var fechaCorteRecord = resultSet[t].getValue({
                  name: 'custrecord_ft_wwfgl_fechacorte',
                });
                var mFeeGenerado = resultSet[t].getValue({
                  name: 'custrecord_ft_wwfgl_mfeegenerado',
                });
                // Pintar solo el año anterior y el año actua, si sale el sig año
                // también agregarlo.
                dataRecord.push({
                  id: id,
                  periodoRecord: periodoRecord,
                  fechaCorteRecord: fechaCorteRecord,
                  mFeeGenerado: mFeeGenerado,
                  periodoText: periodoText,
                });
              }
              start += 1000;
            } while (resultSet && resultSet.length == 1000);
          }
          log.audit({ title: 'dataRecord', details: dataRecord });

          if (dataRecord) {

            /*
            ------------------------------------------------------------------------------------------------------------
            
            */
            // var sessionObj = runtime.getCurrentSession();
            var managementFee = search.load({
              id: 'customsearch_ft_wwfap_gastosmfeeba',
            });

            // var MyFilters = search.createFilter ({
            //   name: 'postingperiod',
            //   operator: 'anyof',
            //   values: periodo1,
            // });

            // managementFee.filters.push (MyFilters);
            var searchManagement = managementFee.run();
            var startSearch = 0;
            do {

              var searchSet = searchManagement.getRange(startSearch, startSearch + 1000)

              for (var z = 0; z < searchSet.length; z++) {
                var objManagement = JSON.parse(
                  JSON.stringify(searchSet[z])
                );
                var objDetalleManagement = objManagement.values;
                // log.audit({ title: 'objDetalleManagement', details: JSON.stringify(objDetalleManagement) });

                var numDocumento = objDetalleManagement['tranid'];
                var fechaGrant = objDetalleManagement['trandate'];

                var arrayPeriodo = objDetalleManagement['postingperiod'];
                for (var b = 0; b < arrayPeriodo.length; b++) {
                  var periodo = arrayPeriodo[b].text;
                  var idPeriodo = arrayPeriodo[b].value;
                }

                var arrayTipo = objDetalleManagement['type'];
                for (var c = 0; c < arrayTipo.length; c++) {
                  var idTipo = arrayTipo[c].value;
                  var nombreTipo = arrayTipo[c].text;
                }

                var arrayNombre = objDetalleManagement['entity'];
                for (var d = 0; d < arrayNombre.length; d++) {
                  var idNombre = arrayNombre[d].value;
                  var nombre = arrayNombre[d].text;
                }

                var arrayCuenta = objDetalleManagement['account'];
                for (var e = 0; e < arrayCuenta.length; e++) {
                  var idCuenta = arrayCuenta[e].value;
                  var nombreCuenta = arrayCuenta[e].text;
                }

                var nota = objDetalleManagement['memo'];

                var importe = objDetalleManagement['amount'];

                var arrayGrant =
                  objDetalleManagement['line.cseg_npo_grant_segm'];
                for (var a = 0; a < arrayGrant.length; a++) {
                  var idGrant = arrayGrant[a].value;
                  var nombreGrant = arrayGrant[a].text;
                }
                var arrayEstructura =
                  objDetalleManagement['line.cseg_npo_fund_p'];
                for (var a = 0; a < arrayEstructura.length; a++) {
                  var idSegmento = arrayEstructura[a].value;
                  var nombreSegmento = arrayEstructura[a].text;
                }



                var porcentajeManagement = objDetalleManagement['line.cseg_npo_grant_segm.custrecord_wwf_mgsl_management'];

                var numTrasaccion = objDetalleManagement['transactionnumber'];

                var mesMF = periodo.split(" ")[0];
                var anioMF = periodo.split(" ")[1];
                if (mesMF == 'ene') {
                  mesMF = '01';
                }
                if (mesMF == 'feb') {
                  mesMF = '02';
                }
                if (mesMF == 'mar') {
                  mesMF = '03';
                }
                if (mesMF == 'abr') {
                  mesMF = '04';
                }
                if (mesMF == 'may') {
                  mesMF = '05';
                }
                if (mesMF == 'jun') {
                  mesMF = '06';
                }
                if (mesMF == 'jul') {
                  mesMF = '07';
                }
                if (mesMF == 'ago') {
                  mesMF = '08';
                }
                if (mesMF == 'sep') {
                  mesMF = '09';
                }
                if (mesMF == 'oct') {
                  mesMF = '10';
                }
                if (mesMF == 'nov') {
                  mesMF = '11';
                }
                if (mesMF == 'dic') {
                  mesMF = '12';
                }

                log.audit("HOLA",objDetalleManagement )

                var fechaFinal = objDetalleManagement['line.cseg_npo_grant_segm.custrecord_npo_grant_end_date'];
                var anioGrant = fechaFinal.split('/')[2];
                var mesGrant = fechaFinal.split('/')[1]
                if (parseInt(mesGrant) < 10) {
                    mesGrant = "0" + mesGrant;
                }

                var fechaEnd = anioGrant + mesGrant;


                if ( parseInt(fechaEnd) >= parseInt(anioCompleto) && parseInt(anio + mes) == parseInt(anioMF + mesMF) && idPeriodo !== "" && nombreGrant != "C852") {
                  infoGrant.push({
                    fechaGrant: fechaGrant,
                    periodo: periodo,
                    idPeriodo: idPeriodo,
                    idTipo: idTipo,
                    nombreTipo: nombreTipo,
                    idNombre: idNombre,
                    nombre: nombre,
                    idCuenta: idCuenta,
                    nombreCuenta: nombreCuenta,
                    nota: nota,
                    importe: importe,
                    idGrant: idGrant,
                    nombreGrant: nombreGrant,
                    porcentajeManagement: porcentajeManagement,
                    numTrasaccion: numTrasaccion,
                    numDocumento: numDocumento,
                    idSegmento: idSegmento,
                    nombreSegmento: nombreSegmento
                  });
                }

              }
              startSearch += 1000;
            } while (searchSet && searchSet.length == 1000)
            //infoGrant = JSON.stringify (infoGrant);
            log.audit({ title: 'infoGrant', details: infoGrant });
            log.audit({ title: 'infoGrant', details: infoGrant.length });

            var sessionObj = runtime.getCurrentSession();
            sessionObj.set({
              name: 'custscript_wwf_mg_management',
              value: JSON.stringify(infoGrant),
            });
            var arrayManagement = [];
            var managementAndRecovery = search.create({
              type: 'customrecord_ft_wwfgl_fechacortemf',
              columns: [{ name: 'custrecord_ft_wwfgl_periodomf' }, { name: 'custrecord_ft_wwfgl_commoncost' }],

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
                  var commonCost = resultSet[t].getValue({
                    name: 'custrecord_ft_wwfgl_commoncost'
                  })
                  arrayManagement.push({
                    id: id,
                    managementPeriod: managementPeriod,
                    commonCost: commonCost
                  });
                }
                start += 1000;
              } while (resultSet && resultSet.length == 1000);
            }
            var commonCostHecho = false;
            if (arrayManagement.length > 0) {
              for (var i = 0; i < arrayManagement.length; i++) {
                if (parseInt(arrayManagement[i].managementPeriod) == parseInt(periodo1) && arrayManagement[i].commonCost) {
                  commonCostHecho = true;
                  break;
                }
              }
            }
            log.audit({
              title: "COMMONCOSY:",
              details: JSON.stringify({
                arrayManagement: arrayManagement,
                periodo1: periodo1,
                commonCostHecho: commonCostHecho
              })
            })
            if (commonCostHecho) {
              sessionObj.set({
                name: 'custscript_wwf_mg_managementcc',
                value: "true"
              });
            } else {
              sessionObj.set({
                name: 'custscript_wwf_mg_managementcc',
                value: "false"
              });
            }
            // sessionObj.set({
            //   name: 'custscript_wwf_mg_management',
            //   value: 
            // })

            redirect.toSuitelet({
              scriptId: 'customscript_wwf_mgsl_upd_percent_mf',
              deploymentId: 'customdeploy_wwf_mgsl_upd_percent_mf',
            });
          }


        }
      } catch (error) {
        log.audit({
          title: 'Error al ejecutar cálculo cierre de mes',
          details: error,
        });
      }
    }

    return {
      onRequest: onRequest,
    };
  }
);
