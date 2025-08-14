"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allUserRoles = exports.ENUM_GENDER = exports.ENUM_USER_ROLE = void 0;
var ENUM_USER_ROLE;
(function (ENUM_USER_ROLE) {
    ENUM_USER_ROLE["SUPER_ADMIN"] = "super_admin";
    ENUM_USER_ROLE["ADMIN"] = "admin";
    ENUM_USER_ROLE["CUSTOMER"] = "customer";
    ENUM_USER_ROLE["AFFILIATE"] = "affiliate";
})(ENUM_USER_ROLE || (exports.ENUM_USER_ROLE = ENUM_USER_ROLE = {}));
var ENUM_GENDER;
(function (ENUM_GENDER) {
    ENUM_GENDER["MALE"] = "male";
    ENUM_GENDER["FEMALE"] = "female";
    ENUM_GENDER["OTHERS"] = "others";
})(ENUM_GENDER || (exports.ENUM_GENDER = ENUM_GENDER = {}));
exports.allUserRoles = Object.values(ENUM_USER_ROLE);
