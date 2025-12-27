"use strict";
var common_vendor = require("../common/vendor.js");
var utils_storage = require("../utils/storage.js");
const state = common_vendor.reactive({
  token: utils_storage.getCache("token"),
  profile: utils_storage.getCache("user")
});
const useUserStore = () => {
  const setUser = (profile, token) => {
    state.profile = profile;
    if (token) {
      state.token = token;
      utils_storage.setCache("token", token, 24 * 60);
    }
    utils_storage.setCache("user", profile, 24 * 60);
  };
  const logout = () => {
    state.profile = null;
    state.token = null;
    utils_storage.removeCache("user");
    utils_storage.removeCache("token");
  };
  return {
    state: common_vendor.readonly(state),
    setUser,
    logout
  };
};
exports.useUserStore = useUserStore;
