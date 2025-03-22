sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Token",
    "sap/ui/core/library",
    "sap/ui/export/library",
    "sap/ui/export/Spreadsheet",
    "sap/m/Dialog",
    "sap/m/library",
    "sap/m/Button",
    "sap/m/Text",
    "sap/ui/model/Sorter",
    "sap/ui/model/Filter",
    "sap/m/SearchField",
    "sap/ui/table/Column",
    "sap/m/Column",
    "sap/m/Label",
    "sap/ui/model/type/String",
    "sap/ui/comp/library",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/ui/core/message/Message",
    "sap/m/MessageBox",
    'sap/m/Tokenizer',
], (Controller, Token, coreLibrary, exportLibrary, Spreadsheet, Dialog, mobileLibrary, Button, Text, Sorter, Filter,
    SearchField, UIColumn, MColumn, Label, TypeString, compLibrary, FilterOperator, Fragment, Message, MessageBox,Tokenizer) => {
    "use strict";
    var sUrl, sToken;
    var kanbanLogs = [], HierarchyEntries = [],oDialogmaterialVH;
    var ValueState = coreLibrary.ValueState;
    var omaterialsModel = new sap.ui.model.json.JSONModel(),omaterialsVHModel = new sap.ui.model.json.JSONModel(), osuppliersModel = new sap.ui.model.json.JSONModel(), oFieldModel, oHierarchyEntryModel, oExecuteBusyModel;
    return Controller.extend("kanbancard.controller.kanban_view", {
        onInit() {
            var that = this;
            oFieldModel = new sap.ui.model.json.JSONModel({
                bHideColumn: false
            });
            that.getView().setModel(oFieldModel, "FieldProperty");

            //Material Input Validator
            var oMaterialInput = this.getView().byId('id_mat');
            oMaterialInput.addValidator(function (args) {
                if (args.suggestionObject) {
                    var key = args.suggestionObject.getCells()[0].getText();
                    var text = args.suggestionObject.getCells()[0].getText();
                    return new Token({ key: key, text: text });
                }
                return null;
            });

            var oSupplierInput = this.getView().byId('id_supplier');
            oSupplierInput.addValidator(function (args) {
                if (args.suggestionObject) {
                    var key = args.suggestionObject.getCells()[0].getText();
                    var text = args.suggestionObject.getCells()[0].getText();
                    return new Token({ key: key, text: text });
                }
                return null;
            });
            var oPlantInput = this.getView().byId('id_plant');
            oPlantInput.addValidator(function (args) {
                if (args.suggestionObject) {
                    var key = args.suggestionObject.getCells()[0].getText();
                    var text = args.suggestionObject.getCells()[0].getText();
                    return new Token({ key: key, text: text });
                }
                return null;
            });
        },
        onMaterialliveChange: async function (oEvent) {
            var oModel = this.getView().getModel(),
                sNewValue = oEvent.getParameter("value"),
                that = this,
                oFilter = [],
                oMaterialfilter;
            oMaterialfilter = new sap.ui.model.Filter({
                filters: [
                    new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.Contains, sNewValue),
                    new sap.ui.model.Filter("MaterialText", sap.ui.model.FilterOperator.Contains, sNewValue)
                ],
                and: false
            });
            oFilter.push(oMaterialfilter);
            let oMaterials = await that._getmaterials(oModel, oFilter);
            if (oMaterials !== '404') {
                omaterialsModel.setData(oMaterials);
                omaterialsModel.refresh();
                that.getView().setModel(omaterialsModel, "Materials");
            } else {
                oMaterials = [];
                omaterialsModel.setData(oMaterials);
                omaterialsModel.refresh();
                that.getView().setModel(omaterialsModel, "Materials");
            }
        },
        onSupplierliveChange: async function (oEvent) {
            var oModel = this.getView().getModel(),
                sNewValue = oEvent.getParameter("value"),
                that = this,
                oFilter = [],
                oSupplierfilter;
            oSupplierfilter = new sap.ui.model.Filter({
                filters: [
                    new sap.ui.model.Filter("Supplier", sap.ui.model.FilterOperator.Contains, sNewValue),
                    new sap.ui.model.Filter("SupplierName", sap.ui.model.FilterOperator.Contains, sNewValue)
                ],
                and: false
            });
            oFilter.push(oSupplierfilter);
            let oSuppliers = await that._getsuppliers(oModel, oFilter);
            if (oSuppliers !== '404') {
                osuppliersModel.setData(oSuppliers);
                that.getView().setModel(osuppliersModel, "Suppliers");
            } else {
                oSuppliers = []
                osuppliersModel.setData(oSuppliers);
                osuppliersModel.refresh();
                that.getView().setModel(osuppliersModel, "Suppliers");
            }
        },
        onChangematerial: async function(oEvent){
            var oValue = oEvent.getParameter("newValue");
            var oMultiInput = this.getView().byId("id_mat"),
            oModel =this.getView().getModel(),
            that = this,
            oFilter = [],ofilterMaterial,MaterialsVH = [];
            if(oValue){
                ofilterMaterial = new sap.ui.model.Filter("Material", "EQ", oValue);
                oFilter.push(ofilterMaterial);
                var oMaterialsVH = await that._getmaterials(oModel,oFilter);
                if(oMaterialsVH == '404'){
                    oMultiInput.setValueState(ValueState.Warning);
                    oMultiInput.setValueStateText('Invalid Material');
                }else{
                    oMultiInput.setValueState(ValueState.None);
                    oMultiInput.setValueStateText('');
                    var oMaterialTokens  = oMultiInput.getTokens();
                    oMaterialTokens.map(function(oToken){
                        MaterialsVH.push({MaterialId:oToken.getKey()});
                    });
                    let filteredTokenMaterials = MaterialsVH.filter(item => item.MaterialId == oValue);
                    if (filteredTokenMaterials.length > 0){
                    }else{
                        oMultiInput.addToken(new sap.m.Token({
                            key: oValue, text: oValue
                        }));
                    }
                }
            }else{
                oMultiInput.setValueState(ValueState.None);
                oMultiInput.setValueStateText('');
            }
        },
        onMaterialSelected: function(oEvent){
            this.getView().byId("id_mat").setValueState(ValueState.None);
            this.getView().byId("id_mat").setValueStateText('');
        },
        onMaterialVH: async function(oEvent){
            var oModel = this.getView().getModel(),
            that = this,
            oFilter;
            oDialogmaterialVH = this.byId("materialVHDialog");
            let oMaterialsVH = await that._getmaterials(oModel, oFilter);
            if (oMaterialsVH !== '404') {
                omaterialsVHModel.setData(oMaterialsVH);
                omaterialsVHModel.refresh();
                that.getView().setModel(omaterialsVHModel, "MaterialsVH");
            } else {
                oMaterialsVH = [];
                omaterialsVHModel.setData(oMaterialsVH);
                omaterialsVHModel.refresh();
                that.getView().setModel(omaterialsVHModel, "MaterialsVH");
            }
            if (!oDialogmaterialVH) {
                oDialogmaterialVH = new sap.ui.xmlfragment(this.getView().getId(), "kanbancard.view.MaterialVH", this);
                this.getView().addDependent(oDialogmaterialVH);
                oDialogmaterialVH.open();
            }else{
                oDialogmaterialVH.open();
            }
        },
        closematerialVHDialog: function(){
            this.getView().byId("materialVHDialog").close();
        },
        _getmaterials: function (oModel, filters) {
            return new Promise((resolve, reject) => {
                oModel.read("/Materials", {
                    filters: filters,
                    urlParameters: { "$top": 200 },
                    success: function (oData) {
                        var aMaterials = oData.results;
                        if (aMaterials.length > 0) {
                            resolve(aMaterials);
                        } else {
                            resolve('404');
                        }
                    },
                    error: function (oError) {
                        reject('404');
                    }
                });
            });
        },
        _getsuppliers: function (oModel, filters) {
            return new Promise((resolve, reject) => {
                oModel.read("/Supplier", {
                    filters: filters,
                    urlParameters: { "$top": 200 },
                    success: function (oData) {
                        var aSuppliers = oData.results;
                        if (aSuppliers.length > 0) {
                            resolve(aSuppliers);
                        } else {
                            resolve('404');
                        }
                    },
                    error: function (oError) {
                        reject('404');
                    }
                });
            });
        },
        onFilter: async function () {
            var oPlants = this.getView().byId("id_plant").getTokens(),
                oSuppliers = this.getView().byId("id_supplier").getTokens(),
                oMaterials = this.getView().byId("id_mat").getTokens(),
                oModel = this.getView().getModel(),
                oHierarchyEntryModel = new sap.ui.model.json.JSONModel(),
                oFilter = [], ofilterPlant, ofilterMaterial, ofilterSuppliers, that = this;
            oFieldModel = this.getView().getModel("FieldProperty");
            oFieldModel.setProperty("/bHideColumn", false);
            oFieldModel.refresh();
            oExecuteBusyModel = new sap.m.BusyDialog({
                title: "Printing Kanban Labels",
                text: "Please wait....."
            });
            oExecuteBusyModel.open();
            if (oMaterials.length > 0) {
                if (oMaterials.length > 0) {
                    var oFilterMultiMaterials = [];
                    oMaterials.map(function (oMaterial) {
                        oFilterMultiMaterials.push(new sap.ui.model.Filter("partnumber", "EQ", oMaterial.getText()));
                    });
                    ofilterMaterial = new sap.ui.model.Filter({
                        filters: oFilterMultiMaterials,
                        and: false
                    });
                    oFilter.push(ofilterMaterial);
                }
                if (oSuppliers.length > 0) {
                    var oFilterMultiSuppliers = [];
                    oSuppliers.map(function (oSupplier) {
                        oFilterMultiSuppliers.push(new sap.ui.model.Filter("vendornumber", "EQ", oSupplier.getText()));
                    });
                    ofilterSuppliers = new sap.ui.model.Filter({
                        filters: oFilterMultiSuppliers,
                        and: false
                    });
                    oFilter.push(ofilterSuppliers);
                }
                if (oPlants.length > 0) {
                    var oFilterMultiPlants = [];
                    oPlants.map(function (oPlant) {
                        oFilterMultiPlants.push(new sap.ui.model.Filter("plant", "EQ", oPlant.getText()));
                    });
                    ofilterPlant = new sap.ui.model.Filter({
                        filters: oFilterMultiPlants,
                        and: false
                    });
                    oFilter.push(ofilterPlant);
                }
                HierarchyEntries = [];
                try {
                    let sKanbans = await that._getKanbandata(oModel, oFilter);
                    try {
                        if (sKanbans == '404') {
                            HierarchyEntries = [];
                            oHierarchyEntryModel.setData(HierarchyEntries);
                            this.getView().setModel(oHierarchyEntryModel, "Entries");
                            oExecuteBusyModel.close();
                            MessageBox.information("No data found please try with other criteria!!");
                        } else {
                            if (sKanbans.length > 0) {
                                for (var i = 0; i < sKanbans.length; i++) {
                                    var oKanbanentry = {};
                                    oKanbanentry.partnumber = sKanbans[i].partnumber;
                                    oKanbanentry.plant = sKanbans[i].plant;
                                    oKanbanentry.vendornumber = sKanbans[i].vendornumber;
                                    oKanbanentry.partdescription = sKanbans[i].partdescription;
                                    oKanbanentry.vendorname = sKanbans[i].vendorname;
                                    oKanbanentry.baseunit = sKanbans[i].baseunit;
                                    oKanbanentry.moqquant = sKanbans[i].moqquant;
                                    oKanbanentry.boxquant = sKanbans[i].boxquant;
                                    oKanbanentry.strikequant = sKanbans[i].strikequant;
                                    oKanbanentry.leadtime = sKanbans[i].leadtime;
                                    oKanbanentry.Status = '';
                                    oKanbanentry.Message = '';
                                    HierarchyEntries.push(oKanbanentry);
                                };
                                oHierarchyEntryModel.setData(HierarchyEntries);
                                this.getView().setModel(oHierarchyEntryModel, "Entries");
                                oExecuteBusyModel.close();
                            }
                        }
                    } catch (error) {
                        MessageBox.information("No data found please try with other criteria!!");
                        oExecuteBusyModel.close();
                    }
                } catch (error) {
                    MessageBox.error("500 Internal Error to get Data");
                }


            } else {
                MessageBox.warning("Material is Mandatory. Please fill the details");
                HierarchyEntries = [];
                oHierarchyEntryModel.setData(HierarchyEntries);
                this.getView().setModel(oHierarchyEntryModel, "Entries");
                oExecuteBusyModel.close();
            }
        },
        _getKanbandata: function (oModel, filters) {
            return new Promise((resolve, reject) => {
                oModel.read("/Kanbans", {
                    filters: filters,
                    urlParameters: { "$top": 500 },
                    success: function (oData) {
                        var aKanbans = oData.results;
                        if (aKanbans.length > 0) {
                            resolve(aKanbans);
                        } else {
                            resolve('404');
                        }
                    },
                    error: function (oError) {
                        reject('404');
                    }
                });
            });
        },
        onExecute: async function (oEvent) {
            var that = this,
                oTable = this.getView().byId("tableId1"),
                oSelectedItems = oTable.getSelectedItems(),
                oSelectedItemArray = [];
            var oConfigDataModel = this.getOwnerComponent().getModel('configurationModel');
            var oConfigData = oConfigDataModel.getData().items;
            var oPrinter = this.getView().byId('id_printer').getValue();
            var oQuantity = this.getView().byId('id_id_quantity_val').getValue();
            if (oPrinter && oQuantity){
                this.getView().byId('id_printer').setValueState(ValueState.None);
                this.getView().byId('id_id_quantity_val').setValueState(ValueState.None);
                try {
                    if (oConfigData.length > 0) {
                        let urldetails = oConfigData.filter(function (item) {
                            return item.fieldname === 'URL';
                        });
                        if (urldetails.length > 0) {
                            sUrl = urldetails[0].value;
                        }
                        let tokendetails = oConfigData.filter(function (item) {
                            return item.fieldname === 'TOKEN';
                        });
                        if (tokendetails.length > 0) {
                            sToken = tokendetails[0].value;
                        }
                    }
                } catch (error) {
                    sToken = '';
                    sUrl = '';
                }
                if (sUrl && sToken) {
                    if (oSelectedItems.length > 0) {
                        var oLoftware = {}, Variables;
                        oLoftware.Variables = [];
                        oLoftware.FileVersion = "";
                        oLoftware.PrinterSettings = "";
                        for (var oSelectedItem of oSelectedItems) {
                            Variables = {};
                            var oContext = oSelectedItem.getCells();
                            var urllabel = "/Labels/Templates/IHP KANBAN CARD.nlbl";
                            if (urllabel) {
                                Variables.FilePath = urllabel;
                            }
                            if (oPrinter) {
                                Variables.Printer = oPrinter;
                            }
                            Variables.Quantity = oQuantity;
                            Variables.Barc0008 = oContext[1].getText(); //Material
                            Variables.Text0014 = oContext[2].getText();//Material Text
                            Variables.Text0058 = oContext[3].getText();//Base Unit Of Measure
                            Variables.Text0032 = oContext[4].getText();//Vendor Name
                            Variables.Text0031 = oContext[5].getText();//Vednor Number
                            if (oContext[6].getText() == '0'){
                            }else{
                                Variables.Barc0029 = oContext[6].getText();//Mou Quantity
                            }
                            if (oContext[7].getText() == '0'){
                            }else{
                                Variables.Text0043 = oContext[7].getText();//Box Quantity
                            }
                            if (oContext[8].getText() == '0'){
                            }else{
                                Variables.Text0045 = oContext[8].getText();//Strike Quantity
                            }
                            if (oContext[9].getText().trim() == '0'){
                            }else{
                                Variables.Text0046 = oContext[9].getText().trim();//Lead Time`
                            }
                            oLoftware.Variables.push(Variables);
                        }
                        if (oLoftware.Variables.length > 0) {
                            console.log(oLoftware);
                            var oLoftwareJson = JSON.stringify(oLoftware);
                            try {
                                 var oResult = await that._sendkanbanlabels(sUrl, oLoftwareJson);
                                 try {
                                    console.log(oResult);
                                    if(oResult === '201'){
                                        MessageBox.success(kanbanLogs[0].Message);
                                    }else{
                                        MessageBox.error(kanbanLogs[0].Message);
                                    }
    
                                 } catch (error) {
                                    
                                 }
                            } catch (error) {
                            }
                        } else {
    
                        }
                    } else {
                        MessageBox.warning("No Orders selected to print labels");
                    }
    
                } else {
                    MessageBox.warning("No Loftware Configurations maintaned!! Please Configure");
                }

            }else{
                MessageBox.warning("Fill Mandatory Fields");
                if (!oPrinter){
                    this.getView().byId('id_printer').setValueState(ValueState.Error);
                    this.getView().byId('id_printer').setValueStateText('Print Queue is mandatory');
                }else{
                    this.getView().byId('id_printer').setValueState(ValueState.None);
                    this.getView().byId('id_printer').setValueStateText('');
                }
                if (!oQuantity){
                    this.getView().byId('id_id_quantity_val').setValueState(ValueState.Error);
                    this.getView().byId('id_id_quantity_val').setValueStateText('Number of Kanban Cards is Mandatory');
                }else{
                    this.getView().byId('id_id_quantity_val').setValueState(ValueState.None);
                    this.getView().byId('id_id_quantity_val').setValueStateText('');
                }
            }

        },
        /*Printer value help */
        onPrinterVH: function(){
            
        },
        _sendkanbanlabels: async function (sUrl, oLoftwareJson) {
            return new Promise((resolve, reject) => {
                $.ajax({
                    type: "POST",
                    url: sUrl,
                    dataType: "json",
                    contentType: "application/json",
                    data: oLoftwareJson,
                    crossDomain: true,
                    headers: {
                        "Ocp-Apim-Subscription-Key": sToken
                    },
                    success: function (response) {
                        console.log("Success:", response);
                        if (response) {
                            var sResponse = response.Response;
                        }
                        resolve('201');
                        kanbanLogs.push({ Status: 'S', Message: sResponse })
                    },
                    error: function (xhr, textStatus, errorThrown) {
                        console.log("Error:", xhr);
                        try {
                            var message = JSON.parse(xhr.responseText);
                            var sMessage = message.Message;
                        } catch (error) {
                            var message = xhr.responseText;
                            var sMessage = message
                        }
                        if (sMessage) {
                            var aMessage = sMessage;
                        }
                        resolve('404');
                        kanbanLogs.push({ Status: 'E', Message: aMessage })
                    }
                });
            })
        }
    });
});