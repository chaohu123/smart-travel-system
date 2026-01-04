"use strict";
var common_vendor = require("../../common/vendor.js");
var store_user = require("../../store/user.js");
require("../../utils/storage.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const store = store_user.useUserStore();
    const currentUser = common_vendor.computed(() => store.state.profile);
    const defaultAvatar = "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200";
    const targetUser = common_vendor.ref({
      userId: 0,
      nickname: "",
      avatar: ""
    });
    const currentUserAvatar = common_vendor.computed(() => {
      var _a;
      return ((_a = currentUser.value) == null ? void 0 : _a.avatar) || defaultAvatar;
    });
    const messages = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const pageNum = common_vendor.ref(1);
    common_vendor.ref(20);
    const hasMore = common_vendor.ref(true);
    const inputText = common_vendor.ref("");
    const inputFocus = common_vendor.ref(false);
    const scrollTop = common_vendor.ref(0);
    const scrollIntoView = common_vendor.ref("");
    const loadMessages = async (reset = false) => {
      var _a;
      if (!((_a = currentUser.value) == null ? void 0 : _a.id) || !targetUser.value.userId)
        return;
      if (reset) {
        pageNum.value = 1;
        hasMore.value = true;
        messages.value = [];
      }
      if (loading.value || !reset && !hasMore.value)
        return;
      loading.value = true;
      try {
        const mockMessages = [
          {
            id: 1,
            senderId: targetUser.value.userId,
            content: "\u4F60\u597D\uFF0C\u8BF7\u95EE\u8FD9\u4E2A\u666F\u70B9\u600E\u4E48\u53BB\uFF1F",
            createTime: new Date(Date.now() - 36e5).toISOString(),
            isOwn: false,
            avatar: targetUser.value.avatar
          },
          {
            id: 2,
            senderId: currentUser.value.id,
            content: "\u4F60\u597D\uFF01\u4F60\u53EF\u4EE5\u5750\u5730\u94C12\u53F7\u7EBF\u5230XX\u7AD9\uFF0C\u7136\u540E\u6B65\u884C10\u5206\u949F\u5C31\u5230\u4E86\u3002",
            createTime: new Date(Date.now() - 33e5).toISOString(),
            isOwn: true
          },
          {
            id: 3,
            senderId: targetUser.value.userId,
            content: "\u597D\u7684\uFF0C\u8C22\u8C22\u4F60\u7684\u5206\u4EAB\uFF01",
            createTime: new Date(Date.now() - 3e6).toISOString(),
            isOwn: false,
            avatar: targetUser.value.avatar
          }
        ];
        if (reset) {
          messages.value = mockMessages.reverse();
        } else {
          messages.value = [...mockMessages.reverse(), ...messages.value];
        }
        hasMore.value = false;
        common_vendor.nextTick(() => {
          scrollToBottom();
        });
      } catch (error) {
        common_vendor.index.showToast({ title: "\u52A0\u8F7D\u5931\u8D25", icon: "none" });
      } finally {
        loading.value = false;
      }
    };
    const sendMessage = async () => {
      var _a;
      const content = inputText.value.trim();
      if (!content)
        return;
      if (!((_a = currentUser.value) == null ? void 0 : _a.id)) {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u767B\u5F55", icon: "none" });
        return;
      }
      const newMessage = {
        id: Date.now(),
        senderId: currentUser.value.id,
        content,
        createTime: new Date().toISOString(),
        isOwn: true
      };
      messages.value.push(newMessage);
      inputText.value = "";
      common_vendor.nextTick(() => {
        scrollToBottom();
      });
    };
    const scrollToBottom = () => {
      if (messages.value.length > 0) {
        const lastIndex = messages.value.length - 1;
        scrollIntoView.value = `msg-${lastIndex}`;
        setTimeout(() => {
          scrollIntoView.value = "";
        }, 300);
      }
    };
    const formatMessageTime = (time) => {
      if (!time)
        return "";
      const date = new Date(time);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1e3 * 60 * 60 * 24));
      if (days === 0) {
        const hours2 = date.getHours();
        const minutes2 = date.getMinutes();
        return `${hours2.toString().padStart(2, "0")}:${minutes2.toString().padStart(2, "0")}`;
      }
      if (days === 1) {
        return "\u6628\u5929";
      }
      if (days < 7) {
        return `${days}\u5929\u524D`;
      }
      return `${date.getMonth() + 1}-${date.getDate()}`;
    };
    const viewUserProfile = () => {
      common_vendor.index.navigateTo({
        url: `/pages/profile/user-home?userId=${targetUser.value.userId}`
      });
    };
    const goBack = () => {
      common_vendor.index.navigateBack();
    };
    common_vendor.onMounted(() => {
      const pages = getCurrentPages();
      if (pages && pages.length > 0) {
        const currentPage = pages[pages.length - 1];
        const options = currentPage.options || {};
        if (options.userId) {
          targetUser.value.userId = Number(options.userId);
          targetUser.value.nickname = decodeURIComponent(options.nickname || "");
          targetUser.value.avatar = decodeURIComponent(options.avatar || "");
        }
      }
      loadMessages(true);
    });
    common_vendor.onShow(() => {
      loadMessages(true);
    });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(goBack),
        b: targetUser.value.avatar || defaultAvatar,
        c: common_vendor.t(targetUser.value.nickname || "\u672A\u77E5\u7528\u6237"),
        d: common_vendor.o(viewUserProfile),
        e: common_vendor.f(messages.value, (message, index, i0) => {
          return common_vendor.e({
            a: !message.isOwn
          }, !message.isOwn ? {
            b: message.avatar || defaultAvatar
          } : {}, {
            c: common_vendor.t(message.content),
            d: message.isOwn ? 1 : "",
            e: message.isOwn
          }, message.isOwn ? {
            f: common_vendor.unref(currentUserAvatar)
          } : {}, {
            g: common_vendor.t(formatMessageTime(message.createTime)),
            h: message.id,
            i: `msg-${index}`,
            j: message.isOwn ? 1 : ""
          });
        }),
        f: scrollTop.value,
        g: scrollIntoView.value,
        h: inputFocus.value,
        i: common_vendor.o(sendMessage),
        j: common_vendor.o(($event) => inputFocus.value = false),
        k: inputText.value,
        l: common_vendor.o(($event) => inputText.value = $event.detail.value),
        m: common_vendor.o(sendMessage),
        n: inputText.value.trim() ? 1 : ""
      };
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-5be53b82"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/profile/chat.vue"]]);
wx.createPage(MiniProgramPage);
