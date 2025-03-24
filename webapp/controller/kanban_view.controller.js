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
    SearchField, UIColumn, MColumn, Label, TypeString, compLibrary, FilterOperator, Fragment, Message, MessageBox, Tokenizer) => {
    "use strict";
    var sUrl, sToken;
    var kanbanLogs = [], HierarchyEntries = [], oDialogmaterialVH, oDialogsupplierVH, oDialogplantVH;
    var ValueState = coreLibrary.ValueState;
    var omaterialsModel = new sap.ui.model.json.JSONModel(), omaterialsVHModel = new sap.ui.model.json.JSONModel(), osuppliersModel = new sap.ui.model.json.JSONModel(), osuppliersVHModel = new sap.ui.model.json.JSONModel(), oplantsVHModel = new sap.ui.model.json.JSONModel(), oprinterModel = new sap.ui.model.json.JSONModel(),oFieldModel, oHierarchyEntryModel, oExecuteBusyModel;
    return Controller.extend("kanbancard.controller.kanban_view", {
        formatVendorNumber: function(oValue){
            if (oValue) {
                return oValue;
            }else{
                return 'No PIR found'
            }
        },
        formatVendorNumberStatus:function(oValue){
            if (oValue) {
                return 'None';
            }else{
                return 'Error'
            }
        },
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
        onChangematerial: async function (oEvent) {
            var oValue = oEvent.getParameter("newValue");
            var oMultiInput = this.getView().byId("id_mat"),
                oModel = this.getView().getModel(),
                that = this,
                oFilter = [], ofilterMaterial, MaterialsVH = [];
            if (oValue) {
                ofilterMaterial = new sap.ui.model.Filter("Material", "EQ", oValue);
                oFilter.push(ofilterMaterial);
                try {
                    var oMaterialsVH = await that._getmaterials(oModel, oFilter);
                    if (oMaterialsVH == '404') {
                        oMultiInput.setValueState(ValueState.Warning);
                        oMultiInput.setValueStateText('Invalid Material Id- ' + oValue);
                    } else {
                        oMultiInput.setValueState(ValueState.None);
                        oMultiInput.setValueStateText('');
                        var oMaterialTokens = oMultiInput.getTokens();
                        oMaterialTokens.map(function (oToken) {
                            MaterialsVH.push({ MaterialId: oToken.getKey() });
                        });
                        let filteredTokenMaterials = MaterialsVH.filter(item => item.MaterialId == oValue);
                        if (filteredTokenMaterials.length > 0) {
                        } else {
                            oMultiInput.addToken(new sap.m.Token({
                                key: oValue, text: oValue
                            }));
                        }
                    }
                } catch (error) {
                    oMultiInput.setValueState(ValueState.Warning);
                    oMultiInput.setValueStateText('Invalid Material Id- ' + oValue);
                }

            } else {
                oMultiInput.setValueState(ValueState.None);
                oMultiInput.setValueStateText('');
            }
        },
        onMaterialSelected: function (oEvent) {
            this.getView().byId("id_mat").setValueState(ValueState.None);
            this.getView().byId("id_mat").setValueStateText('');
        },
        onSupplierChange: async function (oEvent) {
            var oValue = oEvent.getParameter("newValue");
            var oMultiInput = this.getView().byId("id_supplier"),
                oModel = this.getView().getModel(),
                that = this,
                oFilter = [], ofilterSupplier, SupplierVH = [];
            if (oValue) {
                ofilterSupplier = new sap.ui.model.Filter("Supplier", "EQ", oValue);
                oFilter.push(ofilterSupplier);
                try {
                    var SupplierVH = await that._getsuppliers(oModel, oFilter);
                    if (SupplierVH == '404') {
                        oMultiInput.setValueState(ValueState.Warning);
                        oMultiInput.setValueStateText('Invalid Supplier Id- ' + oValue);
                    } else {
                        oMultiInput.setValueState(ValueState.None);
                        oMultiInput.setValueStateText('');
                        var oSupplierTokens = oMultiInput.getTokens();
                        oSupplierTokens.map(function (oToken) {
                            SupplierVH.push({ SupplierId: oToken.getKey() });
                        });
                        let filteredTokenSuppliers = SupplierVH.filter(item => item.SupplierId == oValue);
                        if (filteredTokenSuppliers.length > 0) {
                        } else {
                            oMultiInput.addToken(new sap.m.Token({
                                key: oValue, text: oValue
                            }));
                        }
                    }
                } catch (error) {
                    oMultiInput.setValueState(ValueState.Warning);
                    oMultiInput.setValueStateText('Invalid Supplier Id- ' + oValue);
                }

            } else {
                oMultiInput.setValueState(ValueState.None);
                oMultiInput.setValueStateText('');
            }
        },
        onSupplierSelected: function (oEvent) {
            this.getView().byId("id_supplier").setValueState(ValueState.None);
            this.getView().byId("id_supplier").setValueStateText('');
        },
        onPlantChange: async function (oEvent) {
            var oValue = oEvent.getParameter("newValue");
            var oMultiInput = this.getView().byId("id_plant"),
                oModel = this.getView().getModel(),
                that = this,
                oFilter = [], ofilterPlant, PlantVH = [];
            if (oValue) {
                ofilterPlant = new sap.ui.model.Filter("Plant", "EQ", oValue);
                oFilter.push(ofilterPlant);
                try {
                    var PlantVH = await that._getplants(oModel, oFilter);
                    if (PlantVH == '404') {
                        oMultiInput.setValueState(ValueState.Warning);
                        oMultiInput.setValueStateText('Invalid Plant- ' + oValue);
                    } else {
                        oMultiInput.setValueState(ValueState.None);
                        oMultiInput.setValueStateText('');
                        var oPlantTokens = oMultiInput.getTokens();
                        oPlantTokens.map(function (oToken) {
                            PlantVH.push({ Plant: oToken.getKey() });
                        });
                        let filteredTokenPlants = PlantVH.filter(item => item.Plant == oValue);
                        if (filteredTokenPlants.length > 0) {
                        } else {
                            oMultiInput.addToken(new sap.m.Token({
                                key: oValue, text: oValue
                            }));
                        }
                    }
                } catch (error) {
                    oMultiInput.setValueState(ValueState.Warning);
                    oMultiInput.setValueStateText('Invalid Plant Id- ' + oValue);
                }

            } else {
                oMultiInput.setValueState(ValueState.None);
                oMultiInput.setValueStateText('');
            }
        },
        onPlantSelected: function (oEvent) {
            this.getView().byId("id_plant").setValueState(ValueState.None);
            this.getView().byId("id_plant").setValueStateText('');
        },
        onMaterialVH: async function (oEvent) {
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
            } else {
                oDialogmaterialVH.open();
            }
        },
        onMaterialSearch: async function (oEvent) {
            var oModel = this.getView().getModel(),
                oTable = this.getView().byId("materialvaluehelp"),
                sQuery = oEvent.getSource().getValue(),
                that = this,
                oFilter = [],
                oMaterialfilter;
            oMaterialfilter = new sap.ui.model.Filter({
                filters: [
                    new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.Contains, sQuery),
                    new sap.ui.model.Filter("MaterialText", sap.ui.model.FilterOperator.Contains, sQuery)
                ],
                and: false
            });
            oFilter.push(oMaterialfilter);
            oTable.removeSelections(true);
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
        },
        OnVHMaterialSelected: function (oEvent) {
            var oMultiInputSelected = this.getView().byId('id_material_value_help');
            var oSelected = oEvent.getParameter('selected');
            var oRemoved = oEvent.getParameter('removed');
            var oValue = oEvent.getParameter('listItem').getCells()[0].getText();
            if (oSelected === true) {
                oMultiInputSelected.addToken(new sap.m.Token({
                    key: oValue, text: oValue
                }));
            } else {
                var removedTokens = oMultiInputSelected.getTokens();
                var index = -1;
                for (var i = 0; i < removedTokens.length; i++) {
                    if (removedTokens[i].getKey() === oValue || removedTokens[i].getText() === oValue) {
                        index = i;
                        break;
                    }
                }
                oMultiInputSelected.removeToken(index);
            }
        },
        okmaterialVHDialog: function () {
            var oTable = this.getView().byId('materialvaluehelp');
            var oSelectedTokens = this.getView().byId('id_material_value_help');
            var oMultiInput = this.getView().byId('id_mat');
            var aTokens = oSelectedTokens.getTokens();
            aTokens.forEach(function (oToken) {
                if (oToken) {
                    oMultiInput.addToken(oToken);
                }
            });
            this.getView().byId("materialVHDialog").close();
            oTable.removeSelections(true);
        },
        closematerialVHDialog: function () {
            var oSelectedTokens = this.getView().byId('id_material_value_help');
            var oTable = this.getView().byId('materialvaluehelp');
            oTable.removeSelections(true);
            oSelectedTokens.removeAllTokens();
            this.getView().byId("materialVHDialog").close();
        },
        /*Supplier Value Help*/
        onSupplierVH: async function () {
            var oModel = this.getView().getModel(),
                that = this,
                oFilter;
            oDialogsupplierVH = this.byId("supplierVHDialog");
            let oSuppliersVH = await that._getsuppliers(oModel, oFilter);
            if (oSuppliersVH !== '404') {
                osuppliersVHModel.setData(oSuppliersVH);
                osuppliersVHModel.refresh();
                that.getView().setModel(osuppliersVHModel, "SupplierVH");
            } else {
                oSuppliersVH = [];
                osuppliersVHModel.setData(oSuppliersVH);
                osuppliersVHModel.refresh();
                that.getView().setModel(osuppliersVHModel, "SupplierVH");
            }
            if (!oDialogsupplierVH) {
                oDialogsupplierVH = new sap.ui.xmlfragment(this.getView().getId(), "kanbancard.view.SupplierVH", this);
                this.getView().addDependent(oDialogsupplierVH);
                oDialogsupplierVH.open();
            } else {
                oDialogsupplierVH.open();
            }
        },
        onSupplierSearch: async function (oEvent) {
            var oModel = this.getView().getModel(),
                oTable = this.getView().byId('suppliervaluehelp'),
                sQuery = oEvent.getSource().getValue(),
                that = this,
                oFilter = [],
                oSupplierfilter;
            oSupplierfilter = new sap.ui.model.Filter({
                filters: [
                    new sap.ui.model.Filter("Supplier", sap.ui.model.FilterOperator.Contains, sQuery),
                    new sap.ui.model.Filter("SupplierName", sap.ui.model.FilterOperator.Contains, sQuery)
                ],
                and: false
            });
            oFilter.push(oSupplierfilter);
            oTable.removeSelections(true);
            let oSuppliersVH = await that._getsuppliers(oModel, oFilter);
            if (oSuppliersVH !== '404') {
                osuppliersVHModel.setData(oSuppliersVH);
                osuppliersVHModel.refresh();
                that.getView().setModel(osuppliersVHModel, "SupplierVH");
            } else {
                oSuppliersVH = [];
                osuppliersVHModel.setData(oSuppliersVH);
                osuppliersVHModel.refresh();
                that.getView().setModel(osuppliersVHModel, "SupplierVH");
            }
        },
        OnVHSupplierSelected: function (oEvent) {
            var oMultiInputSelected = this.getView().byId('id_supplier_value_help');
            var oSelected = oEvent.getParameter('selected');
            var oRemoved = oEvent.getParameter('removed');
            var oValue = oEvent.getParameter('listItem').getCells()[0].getText();
            if (oSelected === true) {
                oMultiInputSelected.addToken(new sap.m.Token({
                    key: oValue, text: oValue
                }));
            } else {
                var removedTokens = oMultiInputSelected.getTokens();
                var index = -1;
                for (var i = 0; i < removedTokens.length; i++) {
                    if (removedTokens[i].getKey() === oValue || removedTokens[i].getText() === oValue) {
                        index = i;
                        break;
                    }
                }
                oMultiInputSelected.removeToken(index);
            }
        },
        oksupplierVHDialog: function () {
            var oTable = this.getView().byId('suppliervaluehelp');
            var oSelectedTokens = this.getView().byId('id_supplier_value_help');
            var oMultiInput = this.getView().byId('id_supplier');
            var aTokens = oSelectedTokens.getTokens();
            aTokens.forEach(function (oToken) {
                if (oToken) {
                    oMultiInput.addToken(oToken);
                }
            });
            this.getView().byId("supplierVHDialog").close();
            oTable.removeSelections(true);
        },
        closesupplierVHDialog: function () {
            var oSelectedTokens = this.getView().byId('id_supplier_value_help');
            var oTable = this.getView().byId('suppliervaluehelp');
            oTable.removeSelections(true);
            oSelectedTokens.removeAllTokens();
            this.getView().byId("supplierVHDialog").close();
        },
        onPlantVH: async function () {
            var oModel = this.getView().getModel(),
                that = this,
                oFilter;
            oDialogplantVH = this.byId("plantVHDialog");
            let oPlantsVH = await that._getplants(oModel, oFilter);
            if (oPlantsVH !== '404') {
                oplantsVHModel.setData(oPlantsVH);
                oplantsVHModel.refresh();
                that.getView().setModel(oplantsVHModel, "PlantVH");
            } else {
                oPlantsVH = [];
                oplantsVHModel.setData(oPlantsVH);
                oplantsVHModel.refresh();
                that.getView().setModel(oplantsVHModel, "PlantVH");
            }
            if (!oDialogplantVH) {
                oDialogplantVH = new sap.ui.xmlfragment(this.getView().getId(), "kanbancard.view.PlantVH", this);
                this.getView().addDependent(oDialogplantVH);
                oDialogplantVH.open();
            } else {
                oDialogplantVH.open();
            }
        },
        onPlantSearch: async function (oEvent) {
            var oModel = this.getView().getModel(),
                oTable = this.getView().byId('plantvaluehelp'),
                sQuery = oEvent.getSource().getValue(),
                that = this,
                oFilter = [],
                oPlantfilter;
            oPlantfilter = new sap.ui.model.Filter({
                filters: [
                    new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.Contains, sQuery),
                    new sap.ui.model.Filter("PlantName", sap.ui.model.FilterOperator.Contains, sQuery)
                ],
                and: false
            });
            oFilter.push(oPlantfilter);
            oTable.removeSelections(true);
            let oPlantsVH = await that._getplants(oModel, oFilter);
            if (oPlantsVH !== '404') {
                oplantsVHModel.setData(oPlantsVH);
                oplantsVHModel.refresh();
                that.getView().setModel(oplantsVHModel, "PlantVH");
            } else {
                oPlantsVH = [];
                oplantsVHModel.setData(oPlantsVH);
                oplantsVHModel.refresh();
                that.getView().setModel(oplantsVHModel, "PlantVH");
            }
        },
        OnVHPlantSelected: function (oEvent) {
            var oMultiInputSelected = this.getView().byId('id_plant_value_help');
            var oSelected = oEvent.getParameter('selected');
            var oRemoved = oEvent.getParameter('removed');
            var oValue = oEvent.getParameter('listItem').getCells()[0].getText();
            if (oSelected === true) {
                oMultiInputSelected.addToken(new sap.m.Token({
                    key: oValue, text: oValue
                }));
            } else {
                var removedTokens = oMultiInputSelected.getTokens();
                var index = -1;
                for (var i = 0; i < removedTokens.length; i++) {
                    if (removedTokens[i].getKey() === oValue || removedTokens[i].getText() === oValue) {
                        index = i;
                        break;
                    }
                }
                oMultiInputSelected.removeToken(index);
            }
        },
        okplantVHDialog: function () {
            var oTable = this.getView().byId('plantvaluehelp');
            var oSelectedTokens = this.getView().byId('id_plant_value_help');
            var oMultiInput = this.getView().byId('id_plant');
            var aTokens = oSelectedTokens.getTokens();
            aTokens.forEach(function (oToken) {
                if (oToken) {
                    oMultiInput.addToken(oToken);
                }
            });
            this.getView().byId("plantVHDialog").close();
            oTable.removeSelections(true);
        },
        closeplantVHDialog: function () {
            var oSelectedTokens = this.getView().byId('id_plant_value_help');
            var oTable = this.getView().byId('plantvaluehelp');
            oTable.removeSelections(true);
            oSelectedTokens.removeAllTokens();
            this.getView().byId("plantVHDialog").close();
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
        _getplants: function (oModel, filters) {
            return new Promise((resolve, reject) => {
                oModel.read("/PlantsVH", {
                    filters: filters,
                    urlParameters: { "$top": 200 },
                    success: function (oData) {
                        var aPlants = oData.results;
                        if (aPlants.length > 0) {
                            resolve(aPlants);
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
        _getprinters: function (oModel, filters) {
            return new Promise((resolve, reject) => {
                oModel.read("/Printers", {
                    filters: filters,
                    urlParameters: { "$top": 200 },
                    success: function (oData) {
                        var aPrinters = oData.results;
                        if (aPrinters.length > 0) {
                            resolve(aPrinters);
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
                title: "Loading Data",
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
                    oExecuteBusyModel.close();
                }


            } else {
                MessageBox.warning("Material is Mandatory. Please fill the details");
                HierarchyEntries = [];
                oHierarchyEntryModel.setData(HierarchyEntries);
                this.getView().setModel(oHierarchyEntryModel, "Entries");
                oExecuteBusyModel.close();
            }
        },
        onUpdateFinished: function(){
            var oTable = this.getView().byId("tableId1");
            var aItems = oTable.getItems();
            for (var i = 0; i < aItems.length; i++) {
                //console.log();
                if (aItems[i].getCells()[5].getText() == 'No PIR found') {
                    aItems[i].getMultiSelectControl(/* bCreateIfNotExist = */ true).setEditable(false);
                } else {
                    aItems[i].getMultiSelectControl(/* bCreateIfNotExist = */ true).setEditable(true);
                }
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
            if (oPrinter && oQuantity) {
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
                    oExecuteBusyModel = new sap.m.BusyDialog({
                        title: "Printing Kanban Labels",
                        text: "Please wait....."
                    });
                    oExecuteBusyModel.open();
                    if (oSelectedItems.length > 0) {
                        var oLoftware = {}, Variables;
                        oLoftware.Variables = [];
                        oLoftware.FileVersion = "";
                        oLoftware.PrinterSettings = "";
                        for (var oSelectedItem of oSelectedItems) {
                            Variables = {};
                            var oContext = oSelectedItem.getCells();
                            oSelectedItemArray.push({ partnumber: oContext[1].getText(), 
                                                      partdescription: oContext[2].getText(), 
                                                      baseunit: oContext[3].getText(),
                                                      vendorname :  oContext[4].getText(),
                                                      vendornumber : oContext[5].getText(),
                                                      moqquant : oContext[6].getText(),
                                                      boxquant : oContext[7].getText(),
                                                      strikequant : oContext[8].getText(),
                                                      leadtime : oContext[9].getText(),
                            });
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
                            if (oContext[6].getText() == '0') {
                            } else {
                                Variables.Barc0029 = oContext[6].getText();//Mou Quantity
                            }
                            if (oContext[7].getText() == '0') {
                            } else {
                                Variables.Text0043 = oContext[7].getText();//Box Quantity
                            }
                            if (oContext[8].getText() == '0') {
                            } else {
                                Variables.Text0045 = oContext[8].getText();//Strike Quantity
                            }
                            if (oContext[9].getText().trim() == '0') {
                            } else {
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
                                    var oModel = this.getView().getModel("Entries");
                                    var oData = oModel.getData();
                                    if (oResult === '201') {
                                        for (var i = 0; i < oData.length; i++) {
                                            let oSelectedArray = oSelectedItemArray.filter(function (section) {
                                                return section.partnumber === oData[i].partnumber && 
                                                       product.partdescription === oData[i].partdescription && 
                                                       product.baseunit === oData[i].baseunit;
                                                       product.vendorname === oData[i].vendorname;
                                                       product.vendornumber === oData[i].vendornumber;
                                                       product.moqquant === oData[i].moqquant;
                                                       product.boxquant === oData[i].boxquant;
                                                       product.leadtime === oData[i].leadtime;
                                            });
                                            if (oSelectedArray.length > 0) {
                                                oData[i].Status = kanbanLogs[0].Status;
                                                oData[i].Message = kanbanLogs[0].Message;
                                            }
                                        }
                                        oModel.refresh();
                                        oFieldModel = this.getView().getModel("FieldProperty");
                                        oFieldModel.setProperty("/bHideColumn", true);
                                        oFieldModel.refresh();
                                        oExecuteBusyModel.close();
                                    } else {
                                        for (var i = 0; i < oData.length; i++) {
                                            let oSelectedArray = oSelectedItemArray.filter(function (section) {
                                                return section.partnumber === oData[i].partnumber && 
                                                       product.partdescription === oData[i].partdescription && 
                                                       product.baseunit === oData[i].baseunit;
                                                       product.vendorname === oData[i].vendorname;
                                                       product.vendornumber === oData[i].vendornumber;
                                                       product.moqquant === oData[i].moqquant;
                                                       product.boxquant === oData[i].boxquant;
                                                       product.leadtime === oData[i].leadtime;
                                            });
                                            if (oSelectedArray.length > 0) {
                                                oData[i].Status = kanbanLogs[0].Status;
                                                oData[i].Message = kanbanLogs[0].Message;
                                            }
                                        }
                                        oModel.refresh();
                                        oFieldModel = this.getView().getModel("FieldProperty");
                                        oFieldModel.setProperty("/bHideColumn", true);
                                        oFieldModel.refresh();
                                        oExecuteBusyModel.close();
                                    }

                                } catch (error) {
                                    MessageBox.error('Error While Printing the kanban labels');
                                    oExecuteBusyModel.close();
                                }
                            } catch (error) {
                                MessageBox.error('Error While Printing the kanban labels');
                                oExecuteBusyModel.close();
                            }
                        } else {

                        }
                    } else {
                        MessageBox.warning("No Orders selected to print labels");
                        oExecuteBusyModel.close();
                    }

                } else {
                    MessageBox.warning("No Loftware Configurations maintaned!! Please Configure");
                    oExecuteBusyModel.close();
                }

            } else {
                MessageBox.warning("Fill Mandatory Fields");
                if (!oPrinter) {
                    this.getView().byId('id_printer').setValueState(ValueState.Error);
                    this.getView().byId('id_printer').setValueStateText('Print Queue is mandatory');
                } else {
                    this.getView().byId('id_printer').setValueState(ValueState.None);
                    this.getView().byId('id_printer').setValueStateText('');
                }
                if (!oQuantity) {
                    this.getView().byId('id_id_quantity_val').setValueState(ValueState.Error);
                    this.getView().byId('id_id_quantity_val').setValueStateText('Number of Kanban Cards is Mandatory');
                } else {
                    this.getView().byId('id_id_quantity_val').setValueState(ValueState.None);
                    this.getView().byId('id_id_quantity_val').setValueStateText('');
                }
            }

        },
        /*Printer value help */
        onPrinterVH: async function (oEvent) {
            var sInputValue = oEvent.getSource().getValue(),
                oView = this.getView(),
                oPlantfilter,
                oModel = this.getView().getModel(),
                that = this;
            let oPrinters = await that._getprinters(oModel);
            if (oPrinters !== '404') {
                oprinterModel.setData(oPrinters);
                oprinterModel.refresh();
                that.getView().setModel(oprinterModel, "Printers");
            } else {
                oPrinters = []
                oprinterModel.setData(oPrinters);
                oprinterModel.refresh();
                that.getView().setModel(oprinterModel, "Printers");
            }
            if (!this._pValueHelpDialogPrinter) {
                this._pValueHelpDialogPrinter = Fragment.load({
                    id: oView.getId(),
                    name: "kanbancard.view.PrinterVH",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            this._pValueHelpDialogPrinter.then(function (oDialog) {
                // Create a filter for the binding
                if (sInputValue) {
                    oDialog.open(sInputValue);
                } else {
                    oDialog.open();
                }
            });
        },
        onValueHelpprinterSearch: async function (oEvent) {
            var oFilter = [], oPrinterfilter,
                oModel = this.getView().getModel(),
                sValue = oEvent.getParameter("value"),
                that = this;
            if (sValue) {
                oPrinterfilter = new sap.ui.model.Filter("Printer", sap.ui.model.FilterOperator.Contains, sValue);
                oFilter.push(oPrinterfilter);
            }
            let oPrinter = await that._getprinters(oModel, oFilter);
            if (oPrinter !== '404') {
                oprinterModel.setData(oPrinter);
                oprinterModel.refresh();
                that.getView().setModel(oprinterModel, "Printers");
            } else {
                oPrinter = [];
                oprinterModel.setData(oPrinter);
                oprinterModel.refresh();
                that.getView().setModel(oprinterModel, "Printers");
            }

        },
        onValueHelpprinterClose: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            var sPrinter = this.getView().byId('id_printer');
            if (oSelectedItem) {
                var oValue = oSelectedItem.getTitle();
                sPrinter.setValue(oValue);
            }

        },
        onPrinterChanges: async function(oEvent){
            var oValue = oEvent.getParameter("newValue"),
                oModel = this.getView().getModel(),ofilterPrinter,oFilter = [];
            if(oValue){
                ofilterPrinter = new sap.ui.model.Filter("Printer", "EQ", oValue);
                oFilter.push(ofilterPrinter);
                try {
                    var oPrinters = await that._getprinters(oModel, oFilter);
                    if (oPrinters == '404') {
                        this.getView().byId('id_printer').setValueState(ValueState.Error);
                        this.getView().byId('id_printer').setValueStateText('Invalid Printer- ' + oValue);
                    } else {
                        this.getView().byId('id_printer').setValueState(ValueState.None);
                        this.getView().byId('id_printer').setValueStateText('');
                    }
                }catch (error){
                    this.getView().byId('id_printer').setValueState(ValueState.Error);
                    this.getView().byId('id_printer').setValueStateText('Invalid Printer- ' + oValue);
                }
            }else{
                this.getView().byId('id_printer').setValueState(ValueState.Error);
                this.getView().byId('id_printer').setValueStateText('Print Queue is mandatory');
            }
        },
        onQuantityChange: function(oEvent){
            var oValue = oEvent.getParameter("newValue");
            if(oValue){
                this.getView().byId('id_id_quantity_val').setValueState(ValueState.None);
                this.getView().byId('id_id_quantity_val').setValueStateText('');
            }else{
                this.getView().byId('id_id_quantity_val').setValueState(ValueState.Error);
                this.getView().byId('id_id_quantity_val').setValueStateText('Number of Kanban Cards is Mandatory');
            }
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