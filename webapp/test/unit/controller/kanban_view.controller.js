/*global QUnit*/

sap.ui.define([
	"kanbancard/controller/kanban_view.controller"
], function (Controller) {
	"use strict";

	QUnit.module("kanban_view Controller");

	QUnit.test("I should test the kanban_view controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
