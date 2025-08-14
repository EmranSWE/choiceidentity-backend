"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarrantyOption = exports.ProductStatus = void 0;
var ProductStatus;
(function (ProductStatus) {
    ProductStatus["ACTIVE"] = "active";
    ProductStatus["INACTIVE"] = "inactive";
    ProductStatus["DRAFT"] = "draft";
    ProductStatus["PREORDER"] = "preorder";
})(ProductStatus || (exports.ProductStatus = ProductStatus = {}));
var WarrantyOption;
(function (WarrantyOption) {
    WarrantyOption["ONE_MONTH"] = "onemonth";
    WarrantyOption["SIX_MONTHS"] = "sixmonth";
    WarrantyOption["ONE_YEAR"] = "oneyear";
    WarrantyOption["NO_WARRANTY"] = "nowarranty";
})(WarrantyOption || (exports.WarrantyOption = WarrantyOption = {}));
