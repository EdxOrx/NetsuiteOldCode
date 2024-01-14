 /**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/runtime', 'N/record', 'N/task'], function(search, runtime, record, task) {

    function execute(context) {
        try {
          log.audit({ title: "Aqui empieza", details: "Aqui empieza" })

          //carga los archivos de la carpeta para procesar
          var arrayArchivosProcesar = listarCarpetas();


          log.audit({ title: "arrayArchivosProcesar", details: arrayArchivosProcesar })

          for (var v = 0; v < arrayArchivosProcesar.arrayFiles.length; v++) {

              var arrayId = arrayArchivosProcesar.arrayFiles[v]
              var nombreArchivo = arrayArchivosProcesar.arrayNombre[v]


              log.audit({ title: "nombre", details: nombreArchivo })
              // Cargamos el archivo csv
              var cargarExcel = file.load({
                  id: arrayId
              })


              var result = [];
              var datosHeader = [];
              var rutHeader = []
              var datos = cargarExcel.getContents();


              datos.replace(/[^a-z0-9\s]/gi, '').replace(/[_\s]/g, '')

              var nuevosDatos = datos.split("\n"); //Separamos cada dato con un salto de linea
              var headers = nuevosDatos[0].split(","); //Tomamos la posicion 0 que es la de los encabezados y lo separamos pór una coma 


              var contador = 0;

              for (var i = 1; i < nuevosDatos.length; i++) {

                  var obj = {};
                  var currentline = nuevosDatos[i].split(",");

                  for (var j = 0; j < headers.length; j++) {

                      obj[headers[j]] = currentline[j];

                  }

                  result.push(obj);

                  contador++;

              }


              result = JSON.stringify(result);
              log.audit({ title: "result", details: result })
              //Del documento excel, metemos datos obligat-os al array datosHeader
              for (var m = 0; m < contador - 1; m++) {


                  var nombreComprador = JSON.parse(result)[m]['Nombre comprador'];
                  var status = JSON.parse(result)[m]['Estado'];
                  var documentoComprador = JSON.parse(result)[m]['Documento del comprador']
                  var email = JSON.parse(result)[m]['Email del comprador']
                  var telefono = JSON.parse(result)[m]['Teléfono contacto pagador']
                  // var currency = JSON.parse(result)[m]['Moneda transacción']
                  var currency = 'COP'
                  var amount = JSON.parse(result)[m]['Valor transacción']
                  var bancoPSE = JSON.parse(result)[m]['Banco PSE']
                  var idOrden = JSON.parse(result)[m]['Id Orden']
                  var descripcion = JSON.parse(result)[m]['Descripción']
                  var codigoRespuesta = JSON.parse(result)[m]['Código de respuesta']
                  var binBanco = JSON.parse(result)[m]['BIN Banco']
                  var numTarjeta = JSON.parse(result)[m]['Número visible']
                  var franquicia = JSON.parse(result)[m]['Franquicia']
                  var codigoAutorizacion = JSON.parse(result)[m]['Código de autorización']
                  var origenTransaccion = JSON.parse(result)[m]['Origen de la transacción']
                  var fechaActualizacion = JSON.parse(result)[m]['Fecha última actualización']
                  var fechaCreacion = JSON.parse(result)[m]['Fecha de creación']

                  // var date = JSON.parse(result)[m]['Fecha de creación']

                  if (documentoComprador == '') {
                      documentoComprador = '9999999999';
                  }

                  datosHeader.push({
                      nombreComprador: nombreComprador,
                      email: email,
                      telefono: telefono,
                      documentoComprador: documentoComprador,
                      currency: currency,
                      status: status,
                      amount: amount,
                      bancoPSE: bancoPSE,
                      idOrden: idOrden,
                      descripcion: descripcion,
                      codigoRespuesta: codigoRespuesta,
                      binBanco: binBanco,
                      numTarjeta: numTarjeta,
                      franquicia: franquicia,
                      codigoAutorizacion: codigoAutorizacion,
                      origenTransaccion: origenTransaccion,
                      fechaActualizacion: fechaActualizacion,
                      fechaCreacion: fechaCreacion
                      // date: date
                  })

                  rutHeader.push(documentoComprador)

              }

          }
          log.audit({ title: 'datosHeader', details: datosHeader })

          getCustomerNetsuite(datosHeader, arrayId, nombreArchivo, rutHeader);
        } catch (e) {
            log.error('function execute error message: ', e.message);
        }
    }


    
    function getCustomerNetsuite(datosHeader, arrayId, nombreArchivo, rutHeader) {

      try {

          var arrayClientesNetsuite = [];
          var arrayClientesNetsuite1 = [];
          var arrayRuts = []


          //Creamos una busqueda guardada de los clientes
          var arraySearch = search.create({
              type: search.Type.CUSTOMER,

              columns: [
                  { name: 'custentity_ogfe_num_doc' },
                  { name: 'firstname' },
                  { name: 'companyname' },
                  { name: 'entityid' },
                  { name: 'subsidiary' },
                  { name: 'email' }

              ]
          })


          var resultData = arraySearch.run();
          var start = 0;


          if (resultData != null) {


              do {
                  var resultSet = resultData.getRange(start, start + 1000)

                  for (var a = 0; a < resultSet.length; a++) {

                      var obj = JSON.parse(JSON.stringify(resultSet[a]))
                      var id = obj.id
                      var numDocumento = obj.values.custentity_ogfe_num_doc
                      var nombreNetsuite = obj.values.firstname
                      var company = obj.values.companyname
                      var entityid = obj.values.entityid
                      var subsidiary = obj.values.subsidiary
                      var email = obj.values.email

                      arrayClientesNetsuite.push({
                          id: id,
                          numDocumento: numDocumento,
                          nombreNetsuite: nombreNetsuite,
                          company: company,
                          entityid: entityid,
                          subsidiary: subsidiary,
                          email: email

                      });

                      arrayClientesNetsuite1.push(email)
                      arrayRuts.push(numDocumento)

                  }
              } while (resultSet && resultSet.length == 1000);
          }
          // log.audit({ title: "arrayClientesNetsuite", details: arrayClientesNetsuite })
          log.audit({ title: "arrayClientesNetsuite.length", details: arrayClientesNetsuite.length })
          log.audit({ title: "arrayRuts", details: arrayRuts })

          customerNew(arrayClientesNetsuite1, datosHeader, arrayRuts, arrayId, nombreArchivo, rutHeader, arrayClientesNetsuite);

      } catch (error) {
          log.audit({
              title: "Error en getCustomerNetsuite",
              details: erro
          })
      }

    }

    //Funcion para dar de alta a los nuevos clientes
    function customerNew(arrayClientesNetsuite1, datosHeader, arrayRuts, arrayId, nombreArchivo, rutHeader, arrayClientesNetsuite) {
        try {

            log.audit({ title: 'datosHeader customerNew', details: datosHeader })
            log.audit({ title: 'arrayClientesNetsuite customerNew', details: arrayClientesNetsuite })

            //Metemos en arrayClientesNuevos a los clientes su rut no este registrado 
            var arrayClientesNuevos = [];
            var arrayClientesNuevos1 = [];
            var arrayClientesNuevos2 = [];
            var arrayClientesNuevos3 = [];
            var arrayClientesNuevos4 = [];


            if (datosHeader) {

                for (var c = 0; c < datosHeader.length; c++) {


                    var nombre = datosHeader[c].nombreComprador
                    var email = datosHeader[c].email
                    var telefono = datosHeader[c].telefono
                    var rut = datosHeader[c].documentoComprador
                    var currency = datosHeader[c].currency
                    var status = datosHeader[c].status
                    var amount = datosHeader[c].amount
                    var bancoPSE = datosHeader[c].bancoPSE
                    var idOrden = datosHeader[c].idOrden
                    var descripcion = datosHeader[c].descripcion
                    var codigoRespuesta = datosHeader[c].codigoRespuesta
                    var binBanco = datosHeader[c].binBanco
                    var numTarjeta = datosHeader[c].numTarjeta
                    var franquicia = datosHeader[c].franquicia
                    var codigoAutorizacion = datosHeader[c].codigoAutorizacion
                    var origenTransaccion = datosHeader[c].origenTransaccion
                    var fechaActualizacion = datosHeader[c].fechaActualizacion
                    var fechaCreacion = datosHeader[c].fechaCreacion
                    // log.audit({ title: 'rut', details: rut })
                    // log.audit({ title: 'rut', details: rut })
                    for (var h = 0; h < arrayClientesNetsuite.length; h++) {
                        var id = arrayClientesNetsuite[h].id
                        var numDocumento = arrayClientesNetsuite[h].numDocumento
                        var email2 = arrayClientesNetsuite[h].email
                        //    Se tiene que validar contra el documento la información del cliente para poder traer el id y hacer una actualiación con record.submitFields
                        if (numDocumento == rut) {
                            if (arrayClientesNuevos4.indexOf(rut) == -1) {
                                arrayClientesNuevos4.push(rut)
                                arrayClientesNuevos3.push({
                                    id: id,
                                    nombre: nombre,
                                    email: email,
                                    telefono: telefono,
                                    rut: rut,
                                    currency: currency,
                                    status: status,
                                    amount: amount,
                                    bancoPSE: bancoPSE,
                                    idOrden: idOrden,
                                    descripcion: descripcion,
                                    codigoRespuesta: codigoRespuesta,
                                    binBanco: binBanco,
                                    numTarjeta: numTarjeta,
                                    franquicia: franquicia,
                                    codigoAutorizacion: codigoAutorizacion,
                                    origenTransaccion: origenTransaccion,
                                    fechaActualizacion: fechaActualizacion,
                                })
                            }
                        }
                    }


                    if ((arrayRuts[c] == "9999999999" || arrayRuts[c] == '') && arrayClientesNetsuite1.indexOf(email) == -1) {

                        arrayClientesNuevos.push({
                            nombre: nombre,
                            email: email,
                            telefono: telefono,
                            rut: rut,
                            currency: currency,
                            status: status,
                            amount: amount,
                            bancoPSE: bancoPSE,
                            idOrden: idOrden,
                            descripcion: descripcion,
                            codigoRespuesta: codigoRespuesta,
                            binBanco: binBanco,
                            numTarjeta: numTarjeta,
                            franquicia: franquicia,
                            codigoAutorizacion: codigoAutorizacion,
                            origenTransaccion: origenTransaccion,
                            fechaActualizacion: fechaActualizacion,
                            fechaCreacion: fechaCreacion
                        });

                    }

                    if (arrayClientesNetsuite1.indexOf(email) == -1 && arrayRuts.indexOf(rut) == -1) {

                        arrayClientesNuevos.push({
                            nombre: nombre,
                            email: email,
                            telefono: telefono,
                            rut: rut,
                            currency: currency,
                            status: status,
                            amount: amount,
                            bancoPSE: bancoPSE,
                            idOrden: idOrden,
                            descripcion: descripcion,
                            codigoRespuesta: codigoRespuesta,
                            binBanco: binBanco,
                            numTarjeta: numTarjeta,
                            franquicia: franquicia,
                            codigoAutorizacion: codigoAutorizacion,
                            origenTransaccion: origenTransaccion,
                            fechaActualizacion: fechaActualizacion,
                            fechaCreacion: fechaCreacion
                        });

                    }

                }

                log.audit({ title: "arrayClientesNuevos", details: arrayClientesNuevos })

                for (var c = 0; c < arrayClientesNuevos.length; c++) {

                    var nombre = arrayClientesNuevos[c].nombre
                    var email = arrayClientesNuevos[c].email
                    var telefono = arrayClientesNuevos[c].telefono
                    var rut = arrayClientesNuevos[c].rut
                    var currency = arrayClientesNuevos[c].currency
                    var status = arrayClientesNuevos[c].status
                    var amount = arrayClientesNuevos[c].amount
                    var bancoPSE = arrayClientesNuevos[c].bancoPSE
                    var idOrden = arrayClientesNuevos[c].idOrden
                    var descripcion = arrayClientesNuevos[c].descripcion
                    var codigoRespuesta = arrayClientesNuevos[c].codigoRespuesta
                    var binBanco = arrayClientesNuevos[c].binBanco
                    var numTarjeta = arrayClientesNuevos[c].numTarjeta
                    var franquicia = arrayClientesNuevos[c].franquicia
                    var codigoAutorizacion = arrayClientesNuevos[c].codigoAutorizacion
                    var origenTransaccion = arrayClientesNuevos[c].origenTransaccion
                    var fechaActualizacion = arrayClientesNuevos[c].fechaActualizacion
                    var fechaCreacion = arrayClientesNuevos[c].fechaCreacion
                    if (arrayClientesNuevos1.indexOf(rut) == -1) {
                        arrayClientesNuevos1.push(rut)
                        arrayClientesNuevos2.push({
                            nombre: nombre,
                            email: email,
                            telefono: telefono,
                            rut: rut,
                            currency: currency,
                            status: status,
                            amount: amount,
                            bancoPSE: bancoPSE,
                            idOrden: idOrden,
                            descripcion: descripcion,
                            codigoRespuesta: codigoRespuesta,
                            binBanco: binBanco,
                            numTarjeta: numTarjeta,
                            franquicia: franquicia,
                            codigoAutorizacion: codigoAutorizacion,
                            origenTransaccion: origenTransaccion,
                            fechaActualizacion: fechaActualizacion,
                            fechaCreacion: fechaCreacion
                        })
                    }
                }

                log.audit({ title: "arrayClientesNuevos2", details: arrayClientesNuevos2 })
                log.audit({ title: "arrayClientesNuevos3", details: arrayClientesNuevos3 })
                log.audit({ title: "arrayClientesNuevos3.length", details: arrayClientesNuevos3.length })

            }

            if (arrayClientesNuevos2.length > 0 || arrayClientesNuevos3.length > 0) {
                createCustomer(arrayClientesNuevos2, datosHeader, arrayClientesNetsuite1, arrayRuts, rutHeader, arrayClientesNuevos3);
            }
            if (arrayClientesNuevos3.length > 0) {
                // createCashSale(arrayClientesNuevos3, datosHeader)
                updateClient(arrayClientesNuevos3)
            }

            // excelValidation();


        } catch (error) {
            log.audit({
                title: "Error en customerNew",
                details: error
            })

        }
    }


    function updateClient(arrayClientesNuevos3) {
        try {
            log.audit({ title: 'Entra a updateClient', details: 'Entra a updateClient' });
            for (var c = 0; c < arrayClientesNuevos3.length; c++) {
                var id = arrayClientesNuevos3[c].id
                var nombre = arrayClientesNuevos3[c].nombre
                var email = arrayClientesNuevos3[c].email
                var telefono = arrayClientesNuevos3[c].telefono
                var rut = arrayClientesNuevos3[c].rut
                // var currency = arrayClientesNuevos3[c].currency
                // var status = arrayClientesNuevos3[c].status
                // var amount = arrayClientesNuevos3[c].amount
                // var bancoPSE = arrayClientesNuevos3[c].bancoPSE
                var idOrden = arrayClientesNuevos3[c].idOrden
                // var descripcion = arrayClientesNuevos3[c].descripcion
                // var codigoRespuesta = arrayClientesNuevos3[c].codigoRespuesta
                // var binBanco = arrayClientesNuevos3[c].binBanco
                // var numTarjeta = arrayClientesNuevos3[c].numTarjeta
                // var franquicia = arrayClientesNuevos3[c].franquicia
                // var codigoAutorizacion = arrayClientesNuevos3[c].codigoAutorizacion
                var origenTransaccion = arrayClientesNuevos3[c].origenTransaccion
                var fechaActualizacion = arrayClientesNuevos3[c].fechaActualizacion
                if (origenTransaccion == 'RECURRING_PAYMENTS') {
                    origenTransaccion = 1
                }

                if (origenTransaccion == 'STANDARD_HTML_v4_0') {
                    origenTransaccion = 2
                }
                if (fechaActualizacion) {
                    var dateInitial2 = format.parse({
                        value: fechaActualizacion,
                        type: format.Type.DATE
                    });

                }
                record.submitFields({
                    type: record.Type.CUSTOMER,
                    id: id,
                    values: {
                        'firstname': nombre,
                        'custentity_wwf_field_tipodon_ind': origenTransaccion,
                        'custentity_wwf_field_fecact_inv': dateInitial2,
                        'custentity_ogfe_num_doc': rut,
                        'email': email,
                        'mobilephone': telefono,
                        'custentity_wwf_mg_id_orden': idOrden
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true,
                        ignoreFieldChange: true
                    }
                });
            }
        } catch (error) {
            log.audit({
                title: "Error en updateClient",
                details: error
            })
        }
    }




    function createCustomer(arrayClientesNuevos1, datosHeader, arrayClientesNetsuite1, arrayRuts, rutHeader, arrayClientesNuevos3) {

        try {
            var arrayClientesNuevos = arrayClientesNuevos1.concat(arrayClientesNuevos3);
            log.audit({ title: 'Entro a createCustomer', details: 'Entro a createCustomer' })
            log.audit({ title: 'arrayClientesNuevos', details: arrayClientesNuevos })
            //  Creamos nuevo registro de cliente 
            var id;

            for (var d = 0; d < arrayClientesNuevos.length; d++) {
                // for (var d = 0; d < 3; d++) {

                var nombre = arrayClientesNuevos[d].nombre
                var rut = arrayClientesNuevos[d].rut
                var email = arrayClientesNuevos[d].email
                var telefono = arrayClientesNuevos[d].telefono
                var origenTransaccion = arrayClientesNuevos[d].origenTransaccion
                var fechaCreacion = arrayClientesNuevos[d].fechaCreacion
                var idOrden = arrayClientesNuevos[d].idOrden
                var bancoPSE = arrayClientesNuevos[d].bancoPSE
                var descripcion = arrayClientesNuevos[d].descripcion
                var codigoRespuesta = arrayClientesNuevos[d].codigoRespuesta
                var binBanco = arrayClientesNuevos[d].binBanco
                var numTarjeta = arrayClientesNuevos[d].numTarjeta
                var franquicia = arrayClientesNuevos[d].franquicia
                var amount = arrayClientesNuevos[d].amount
                var origenTransaccion = arrayClientesNuevos[d].origenTransaccion
                var fechaActualizacion = arrayClientesNuevos[d].fechaActualizacion
                // log.audit({ title: 'origenTransaccion', details: origenTransaccion  })
                // log.audit({ title: 'fechaActualizacion', details: fechaActualizacion  })

                // origenTransaccion = origenTransaccion.split(' ')[0]
                // fechaActualizacion = fechaActualizacion.split(' ')[0]
                var createCustomer = record.create({
                    type: record.Type.CUSTOMER,
                    isDynamic: true
                });
                if (fechaActualizacion) {
                    var dateInitial2 = format.parse({
                        value: fechaActualizacion,
                        type: format.Type.DATE
                    });

                }

                // createCustomer.setValue({
                //     fieldId: 'isperson',
                //     value: 'T'
                // })

                // log.audit({
                //     title: 'aqui1',
                //     details: 'aqui1'
                // })

                //Formulario individuos
                createCustomer.setValue({
                    fieldId: 'customform',
                    value: 64
                })

                createCustomer.setValue({
                    fieldId: 'custentity_ft_wwfcm_tpdonante',
                    value: 1
                })


                createCustomer.setValue({
                    fieldId: 'firstname',
                    value: nombre

                })

                if (origenTransaccion == 'RECURRING_PAYMENTS') {
                    createCustomer.setValue({
                        fieldId: 'custentity_wwf_field_tipodon_ind',
                        value: 1
                    })
                }

                if (origenTransaccion == 'STANDARD_HTML_v4_0') {

                    createCustomer.setValue({

                        fieldId: 'custentity_wwf_field_tipodon_ind',
                        value: 2
                    })
                }

                createCustomer.setValue({
                    fieldId: 'custentity_wwf_field_fecact_inv',
                    value: dateInitial2
                })

                createCustomer.setValue({

                    fieldId: 'custentity_ogfe_num_doc',
                    value: rut
                    // value: rut ? rut : '9999999999'

                })

                createCustomer.setValue({
                    fieldId: 'email',
                    value: email
                })

                createCustomer.setValue({
                    fieldId: 'mobilephone',
                    value: telefono
                })

                createCustomer.setValue({
                    fieldId: 'subsidiary',
                    value: 4
                    // value: "2"
                })

                // createCustomer.setValue({
                //     fieldId: 'custentity_wwf_mg_id_orden',
                //     value: idOrden
                // })

                // log.audit({
                //     title: 'aqui2',
                //     details: 'aqui2'
                // })

                var idCustomer = createCustomer.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                })

                // var scriptObj = runtime.getCurrentScript();

                // log.debug({

                //  title: "Remaining usage units: ",
                //  details: scriptObj.getRemainingUsage()

                // });

                // log.audit({
                //     title: 'scriptObj',
                //     details: scriptObj.getRemainingUsage()
                // })

                id = idCustomer

                log.audit({ title: 'id', details: id })




                log.audit({
                    title: 'Se ha creado el cliente',
                    details: 'Se ha creado el cliente'
                })

                if (id) {



                    //Creamos una busqueda guardada para posteriormente compárar el idOrden
                    var idOrdenCashSale = search.create({
                        type: search.Type.CASH_SALE,

                        columns: 'custbody_wwf_mg_id_orden'
                    })

                    var setData = idOrdenCashSale.run();
                    var start = 0;
                    var arrayIdOrdenesCash = []

                    do {

                        if (setData != '') {

                            var resultSet = setData.getRange(start, start + 1000)

                            for (var k = 0; k < resultSet.length; k++) {
                                var obj1 = JSON.parse(JSON.stringify(resultSet[k]))
                                var objetos = obj1.values
                                if(objetos['custbody_wwf_mg_id_orden']){
                                    arrayIdOrdenesCash.push(objetos['custbody_wwf_mg_id_orden'])
                                }

                            }

                        }

                        start += 1000

                    } while (resultSet && resultSet.length == 1000)

                    // } while (false);
                    log.audit({ title: 'arrayIdOrdenesCash', details: arrayIdOrdenesCash })


                    log.audit({
                        title: 'crando cliente',
                        details: 'El cliente: ' + nombre + ' se esta creando'
                    })

                    //Convertimos la fechaActualizacion a tipo date
                    if (fechaActualizacion) {
                        var newDate = format.parse({
                            value: fechaActualizacion,
                            type: format.Type.DATE
                        });

                    }


                    //Convertimos la fechaCreacion a tipo date 
                    if (fechaCreacion) {
                        var dateInitial = format.parse({
                            value: fechaCreacion,
                            type: format.Type.DATE
                        });

                    }


                    if (idOrden.indexOf(arrayIdOrdenesCash) == -1) {



                        //Iniciamos a crear la Cash Sale
                        var createInvoice = record.create({

                            type: record.Type.CASH_SALE,
                            isDynamic: false

                        })


                        createInvoice.setValue({

                            fieldId: "customform",
                            value: 95
                            // value: '-2'

                        })

                        //Fecha de la creacion en excel
                        createInvoice.setValue({
                            fieldId: 'startdate',
                            value: dateInitial
                        })

                        //Fecha de la ultima actualizacion 
                        createInvoice.setValue({

                            fieldId: 'saleseffectivedate',
                            value: newDate

                        })

                        //Metemos el tipo de donante
                        createInvoice.setValue({

                            fieldId: 'custentity_ft_wwfcm_tpdonante',
                            value: 1

                        })

                        //Metemos el id a la cash sale
                        createInvoice.setValue({

                            fieldId: 'entity',
                            value: id

                        })

                        //Metemos subsidiaria
                        createInvoice.setValue({

                            fieldId: 'subsidiary',
                            value: 4

                        })

                        //Metemos localizacion
                        createInvoice.setValue({

                            fieldId: 'location',
                            value: 10
                            // value: 103

                        })

                        //Metemos valores de banco PSE
                        createInvoice.setValue({

                            fieldId: 'custbody_wwf_mg_banco_pse',
                            value: bancoPSE

                        })

                        //Metemos valores de BIN banco 
                        createInvoice.setValue({

                            fieldId: 'custbody_wwf_mg_bin_banco',
                            value: binBanco

                        })

                        //Metemos item Servicio Payu
                        createInvoice.setSublistValue({

                            sublistId: 'item',
                            fieldId: 'item',
                            value: 584,
                            // value: 1542,
                            line: 0

                        })

                        //Metemos el taxcode al item Servicio Payu
                        createInvoice.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'taxcode',
                            value: 189,
                            // value: 5,
                            line: 0
                        })

                        //MEtemos el monto al record Servicio Payu
                        if(!amount){
                            amount = 1
                        }
                        createInvoice.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            value: amount,
                            line: 0
                        })

                        //Si es pago en efectivo 
                        if (franquicia == 'EFECTY') {

                            createInvoice.setValue({
                                fieldId: 'paymentmethod',
                                // value: "4"
                                value: "1"
                            })

                            createInvoice.setValue({
                                fieldId: 'custbody_wwf_mg_num_tarjeta',
                                value: 'No se ingreso número de tarjeta'
                            })
                        }

                        createInvoice.setValue({
                            fieldId: 'custbody_wwf_mg_id_orden',
                            value: idOrden
                        })
                        // createInvoice.setValue({
                        //     fieldId: 'custbody_wwf_mg_id_orden',
                        //     value: idOrden
                        // })


                        //SI es pago con tarjeta Visa
                        if (franquicia == 'VISA') {


                            log.audit({
                                title: 'Es visa',
                                details: 'Es visa'
                            })

                            createInvoice.setValue({
                                fieldId: 'paymentmethod',
                                value: 5
                            })

                            createInvoice.setValue({
                                fieldId: 'custbody_wwf_mg_num_tarjeta',
                                value: numTarjeta
                            })


                        }

                        //SI es pago con tarjeta MAsterCard
                        if (franquicia == 'MASTERCARD') {

                            log.audit({
                                title: 'Es MasterCard',
                                details: 'Es MasterCard'
                            })

                            createInvoice.setValue({
                                fieldId: 'paymentmethod',
                                value: 4
                            })

                            createInvoice.setValue({
                                fieldId: 'custbody_wwf_mg_num_tarjeta',
                                value: numTarjeta
                            })

                            // log.audit({
                            //     title: 'Numero de tarjeta',
                            //     details: numTarjeta
                            // })

                        }

                        //Si el pago es con tarjeta American Express
                        if (franquicia == 'AMEX') {

                            createInvoice.setValue({
                                fieldId: 'paymentmethod',
                                value: 6
                            })

                            createInvoice.setValue({
                                fieldId: 'custbody_wwf_mg_num_tarjeta',
                                value: numTarjeta
                            })

                        }


                        var idCreateInvoice = createInvoice.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        })

                        log.audit({
                            title: 'idCreateInvoice',
                            details: idCreateInvoice
                        })

                        log.audit({
                            title: '¡La CASH SALE se ha creado con exito!',
                            details: '¡La CASH SALE se ha creado con exito!',
                        })

                    } else {
                        log.audit({
                            title: 'El idOrden ya existe en una Cash Sale',
                            details: 'El idOrden ya existe en una Cash Sale'
                        })
                    }


                }
            }

            excelValidation();

        } catch (error) {
            log.audit({
                title: "Error en createCustomer",
                details: error
            })

        }
    }


    function excelValidation() {



        try {
            var contador = 0

            log.audit({
                title: "Ha entrado a excelValidation ",
                details: "Ha entrado a excelValidation"
            })

            // var arrayRecord = []
            var arrayArchivosProcesar = listarCarpetas();
            var longitud = arrayArchivosProcesar.arrayFiles

            log.audit({
                title: 'arrayArchivosProcesar',
                details: arrayArchivosProcesar
            })

            log.audit({
                title: 'arrayArchivosProcesar.length',
                details: longitud.length
            })

            var busqueda = search.create({

                type: 'customrecord_wwf_payu',

                columns: 'custrecord_wwf_arcpl'

            })

            log.audit({
                title: 'busqueda',
                details: busqueda
            })


            var setData = busqueda.run();
            var start = 0;
            var arrayPlainText = []
            var arrayId = []

            log.audit({
                title: 'setData',
                details: setData
            })

            do {

                if (setData != '') {


                    var resultSet = setData.getRange(start, start + 1000);

                    log.audit({
                        title: 'resultSet',
                        details: resultSet
                    })

                    log.audit({
                        title: 'resultSet',
                        details: resultSet.length
                    })

                    for (var n = 0; n < resultSet.length; n++) {

                        var obj1 = JSON.parse(JSON.stringify(resultSet[n]))
                        var obj2 = obj1.values

                        log.audit({
                            title: 'obj1',
                            details: obj2
                        })

                        // if (resultSet[n].getText({ name: 'custrecord_wwf_mg_arcpl'})) { 
                        if (resultSet[n].getText({
                            name: 'custrecord_wwf_arcpl'
                        })) {

                            arrayPlainText.push(resultSet[n].getText({
                                name: 'custrecord_wwf_arcpl'
                                // name: 'custrecord_wwf_mg_arcpl'
                            }))

                            arrayId.push(id)

                        }

                        log.audit({
                            title: 'arrayPlainText',
                            details: arrayPlainText
                        })

                        log.audit({
                            title: 'arrayId',
                            details: arrayId
                        })


                    }
                }

            } while (resultSet && resultSet.length == 1000)
            // } while (false)



            for (var i = 0; i < longitud.length; i++) {

                var idDocumento = arrayArchivosProcesar.arrayFiles[i]
                var nombre = arrayArchivosProcesar.arrayNombre[i]

                log.audit({
                    title: "idDocumento",
                    details: idDocumento
                });

                log.audit({
                    title: "nombre",
                    details: nombre
                });

                var excelRecord = record.create({
                    type: 'customrecord_wwf_payu',
                    // type: 'customrecord_wwf_mg_payu',
                    isDynamic: true,

                    columns: [

                        {
                            archivo: 'custrecord_wwf_arcpl'
                        }
                        // name: 'customrecord_wwf_mg_payu'    
                    ]

                });



                log.audit({
                    title: "excelRecord",
                    details: excelRecord
                })

                if (arrayPlainText.indexOf(nombre) == -1) {

                    excelRecord.setValue({
                        fieldId: 'name',
                        value: nombre
                    })


                    excelRecord.setValue({
                        fieldId: 'custrecord_wwf_arcpl',
                        value: idDocumento
                    })


                    var id = excelRecord.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    })

                    log.audit({
                        title: 'id',
                        details: id
                    })

                } else {

                    log.audit({
                        title: "El archivo ya existe ",
                        details: 'El archivo: ' + nombre + ' ya existe'
                    })



                }

            }

            // Linea para borrar el archivo del gabinete
            var borrarExcel = file.delete({
                id: idDocumento
            });

            log.audit({
                title: 'Se ha borrado el excel',
                details: borrarExcel
            })

        } catch (error) {

            log.audit({
                title: 'Error en excelValidation',
                details: error
            })
        }


    }

    //Funcion para procesar los archivos excel
    function listarCarpetas() {

        var arrayFiles = [];
        var arrayNombre = [];
        try {

            var searchFiles = search.create({
                type: 'file',
                filters: ["folder", "anyof", 'null', 2824],
                // filters: ['folder', 'anyof', null, 789],
                columns: 'name'
            });


            log.audit({
                title: 'searchFiles',
                details: searchFiles
            })


            var setData = searchFiles.run().getRange({
                start: 0,
                end: 10
            });


            start = 0;

            if (setData != '') {

                do {

                    for (var i = 0; i < setData.length; i++) {

                        var resultSet = JSON.parse(JSON.stringify(setData[i]))
                        var name = resultSet.values.name


                        arrayFiles.push(

                            setData[i].id

                        )
                        arrayNombre.push(
                            name
                        )



                    }


                    start += 1000;

                } while (setData && setData.length == 1000)
                // } while (false)


            }



        } catch (error) {

            log.audit({
                title: "Error en listarCarpetas",
                details: error
            })

        } finally {
            var a = {
                arrayFiles: arrayFiles,
                arrayNombre: arrayNombre
            }
            return a
        }


    }
    return {
        execute: execute
    };
});