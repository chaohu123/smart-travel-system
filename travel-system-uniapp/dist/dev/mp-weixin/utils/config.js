"use strict";
const LOCAL_IP = "192.168.142.1";
const MP_WEIXIN_CONFIG = {
  API_BASE_URL: `http://${LOCAL_IP}:8080/api/v1`,
  STATIC_BASE_URL: `http://${LOCAL_IP}:8080`
};
const getConfig = () => {
  return MP_WEIXIN_CONFIG;
};
const config = getConfig();
const API_BASE_URL = config.API_BASE_URL;
const STATIC_BASE_URL = config.STATIC_BASE_URL;
const AMAP_WEB_KEY = "b49d114eb175a158b25db7bf30156a3d";
const defaultFoodImage = "https://ts1.tc.mm.bing.net/th/id/R-C.6f2c45f0e1970f362d4cb5e4e39a985f487cc?rik=y5WZ1SI%2fQsLR%2fA&riu=http%3a%2f%2fimg.daimg.com%2fuploads%2fallimg%2f190325%2f1-1Z325231625.jpg&ehk=O4I2%2bCxYfa8flgaMO4bok8%2fOAc8lDH1fs8%2fhpgKoBZ0%3d&risl=&pid=ImgRaw&r=0";
const defaultScenicImage = "https://bpic.588ku.com/art_origin_min_pic/19/03/30/910fc9dd6202cca55e4e39a985f487cc.jpg";
exports.AMAP_WEB_KEY = AMAP_WEB_KEY;
exports.API_BASE_URL = API_BASE_URL;
exports.STATIC_BASE_URL = STATIC_BASE_URL;
exports.defaultFoodImage = defaultFoodImage;
exports.defaultScenicImage = defaultScenicImage;
