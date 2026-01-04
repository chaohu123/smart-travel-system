"use strict";
var common_vendor = require("../../common/vendor.js");
var store_user = require("../../store/user.js");
var api_user = require("../../api/user.js");
var utils_storage = require("../../utils/storage.js");
require("../../utils/http.js");
require("../../utils/config.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const store = store_user.useUserStore();
    const user = common_vendor.computed(() => store.state.profile);
    const defaultAvatar = "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200";
    const userInfoCache = common_vendor.ref({});
    const getUserInfo = async (userId) => {
      var _a;
      if (userInfoCache.value[userId]) {
        return userInfoCache.value[userId];
      }
      try {
        const res = await api_user.userApi.getProfile(userId);
        if (res.statusCode === 200 && res.data.code === 200) {
          const userInfo = ((_a = res.data.data) == null ? void 0 : _a.userInfo) || res.data.data || {};
          const info = {
            nickname: userInfo.nickname || "\u672A\u77E5\u7528\u6237",
            avatar: userInfo.avatar || defaultAvatar
          };
          userInfoCache.value[userId] = info;
          return info;
        }
      } catch (error) {
      }
      return { nickname: "\u672A\u77E5\u7528\u6237", avatar: defaultAvatar };
    };
    const fillUserInfo = async (messages) => {
      for (const message of messages) {
        if (message.senderId && (!message.senderAvatar || !message.senderName)) {
          const userInfo = await getUserInfo(message.senderId);
          if (!message.senderAvatar)
            message.senderAvatar = userInfo.avatar;
          if (!message.senderName)
            message.senderName = userInfo.nickname;
        }
        if (message.userId && (!message.avatar || !message.nickname)) {
          const userInfo = await getUserInfo(message.userId);
          if (!message.avatar)
            message.avatar = userInfo.avatar;
          if (!message.nickname)
            message.nickname = userInfo.nickname;
        }
      }
    };
    const tabs = common_vendor.ref([
      { type: "like", label: "\u70B9\u8D5E", unreadCount: 0 },
      { type: "comment", label: "\u8BC4\u8BBA", unreadCount: 0 },
      { type: "chat", label: "\u79C1\u4FE1", unreadCount: 0 }
    ]);
    const activeTab = common_vendor.ref("like");
    const messagesList = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const refreshing = common_vendor.ref(false);
    const pageNum = common_vendor.ref(1);
    common_vendor.ref(10);
    const hasMore = common_vendor.ref(true);
    const loadReadStatusCache = () => {
      const cache = utils_storage.getCache("message_read_status");
      return cache || {};
    };
    const saveReadStatusCache = () => {
      utils_storage.setCache("message_read_status", readStatusCache.value);
    };
    const readStatusCache = common_vendor.ref(loadReadStatusCache());
    const switchTab = (type) => {
      if (activeTab.value === type)
        return;
      activeTab.value = type;
      pageNum.value = 1;
      hasMore.value = true;
      messagesList.value = [];
      loadMessages(true);
    };
    const loadMessages = async (reset = false) => {
      var _a;
      if (!((_a = user.value) == null ? void 0 : _a.id)) {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u767B\u5F55", icon: "none" });
        return;
      }
      if (reset) {
        pageNum.value = 1;
        hasMore.value = true;
        messagesList.value = [];
      }
      if (loading.value || !reset && !hasMore.value)
        return;
      loading.value = true;
      try {
        let newMessages = [];
        if (activeTab.value === "like") {
          newMessages = [
            {
              id: 1,
              senderId: 3,
              senderName: "\u65C5\u884C\u8FBE\u4EBA",
              senderAvatar: "",
              noteId: 1,
              noteTitle: "\u6210\u90FD\u7F8E\u98DF\u4E4B\u65C5",
              noteCover: "",
              isRead: readStatusCache.value[1] === 1,
              createTime: new Date().toISOString()
            },
            {
              id: 2,
              senderId: 4,
              senderName: "\u63A2\u7D22\u8005",
              senderAvatar: "",
              noteId: 2,
              noteTitle: "\u897F\u5B89\u53E4\u57CE\u6E38\u8BB0",
              noteCover: "",
              isRead: readStatusCache.value[2] === 1,
              createTime: new Date(Date.now() - 36e5).toISOString()
            }
          ];
        } else if (activeTab.value === "comment") {
          newMessages = [
            {
              id: 1,
              senderId: 3,
              senderName: "\u65C5\u884C\u8FBE\u4EBA",
              senderAvatar: "",
              noteId: 1,
              noteTitle: "\u6210\u90FD\u7F8E\u98DF\u4E4B\u65C5",
              content: "\u8FD9\u4E2A\u5730\u65B9\u771F\u7684\u5F88\u4E0D\u9519\uFF01",
              isRead: readStatusCache.value[1] === 1,
              createTime: new Date().toISOString()
            },
            {
              id: 2,
              senderId: 4,
              senderName: "\u63A2\u7D22\u8005",
              senderAvatar: "",
              noteId: 2,
              noteTitle: "\u897F\u5B89\u53E4\u57CE\u6E38\u8BB0",
              content: "\u56DE\u590D\u4E86\u4F60\uFF1A\u6211\u4E5F\u60F3\u53BB\u770B\u770B\uFF01",
              isRead: readStatusCache.value[2] === 1,
              createTime: new Date(Date.now() - 72e5).toISOString()
            }
          ];
        } else if (activeTab.value === "chat") {
          const chat1Unread = readStatusCache.value[1001] !== void 0 ? readStatusCache.value[1001] : 2;
          const chat2Unread = readStatusCache.value[1002] !== void 0 ? readStatusCache.value[1002] : 0;
          newMessages = [
            {
              id: 1,
              userId: 3,
              nickname: "\u65C5\u884C\u8FBE\u4EBA",
              avatar: "",
              lastMessage: "\u4F60\u597D\uFF0C\u8BF7\u95EE\u8FD9\u4E2A\u666F\u70B9\u600E\u4E48\u53BB\uFF1F",
              lastMessageTime: new Date().toISOString(),
              unreadCount: chat1Unread
            },
            {
              id: 2,
              userId: 4,
              nickname: "\u63A2\u7D22\u8005",
              avatar: "",
              lastMessage: "\u8C22\u8C22\u4F60\u7684\u5206\u4EAB\uFF01",
              lastMessageTime: new Date(Date.now() - 36e5).toISOString(),
              unreadCount: chat2Unread
            }
          ];
        }
        await fillUserInfo(newMessages);
        if (reset) {
          messagesList.value = newMessages;
        } else {
          messagesList.value.push(...newMessages);
        }
        hasMore.value = false;
        updateUnreadCount();
      } catch (error) {
        common_vendor.index.showToast({ title: "\u52A0\u8F7D\u5931\u8D25", icon: "none" });
      } finally {
        loading.value = false;
        refreshing.value = false;
      }
    };
    const onRefresh = () => {
      refreshing.value = true;
      loadMessages(true);
    };
    const loadMore = () => {
      if (!loading.value && hasMore.value) {
        loadMessages(false);
      }
    };
    const calculateAllUnreadCount = () => {
      let likeUnread = 0;
      let commentUnread = 0;
      let chatUnread = 0;
      const likeMessages = [
        { id: 1, isRead: readStatusCache.value[1] === 1 },
        { id: 2, isRead: readStatusCache.value[2] === 1 }
      ];
      likeUnread = likeMessages.filter((m) => !m.isRead).length;
      const commentMessages = [
        { id: 1, isRead: readStatusCache.value[1] === 1 },
        { id: 2, isRead: readStatusCache.value[2] === 1 }
      ];
      commentUnread = commentMessages.filter((m) => !m.isRead).length;
      const chat1Unread = readStatusCache.value[1001] !== void 0 ? readStatusCache.value[1001] : 2;
      const chat2Unread = readStatusCache.value[1002] !== void 0 ? readStatusCache.value[1002] : 0;
      chatUnread = chat1Unread + chat2Unread;
      return {
        like: likeUnread,
        comment: commentUnread,
        chat: chatUnread,
        total: likeUnread + commentUnread + chatUnread
      };
    };
    const updateUnreadCount = () => {
      if (activeTab.value === "like") {
        tabs.value[0].unreadCount = messagesList.value.filter((m) => !m.isRead).length;
      } else {
        const allUnread2 = calculateAllUnreadCount();
        tabs.value[0].unreadCount = allUnread2.like;
      }
      if (activeTab.value === "comment") {
        tabs.value[1].unreadCount = messagesList.value.filter((m) => !m.isRead).length;
      } else {
        const allUnread2 = calculateAllUnreadCount();
        tabs.value[1].unreadCount = allUnread2.comment;
      }
      if (activeTab.value === "chat") {
        tabs.value[2].unreadCount = messagesList.value.filter((m) => m.unreadCount > 0).reduce((sum, m) => sum + (m.unreadCount || 0), 0);
      } else {
        const allUnread2 = calculateAllUnreadCount();
        tabs.value[2].unreadCount = allUnread2.chat;
      }
      const allUnread = calculateAllUnreadCount();
      utils_storage.setCache("unread_message_count", allUnread.total);
    };
    const viewLikeMessage = async (message) => {
      if (!message.isRead) {
        message.isRead = true;
        readStatusCache.value[message.id] = 1;
        saveReadStatusCache();
        updateUnreadCount();
      }
      if (message.senderId && (!message.senderAvatar || !message.senderName)) {
        const userInfo = await getUserInfo(message.senderId);
        message.senderAvatar = userInfo.avatar;
        message.senderName = userInfo.nickname;
      }
      if (message.noteId) {
        common_vendor.index.navigateTo({ url: `/pages/travel-note/detail?id=${message.noteId}` });
      }
    };
    const viewCommentMessage = async (message) => {
      if (!message.isRead) {
        message.isRead = true;
        readStatusCache.value[message.id] = 1;
        saveReadStatusCache();
        updateUnreadCount();
      }
      if (message.senderId && (!message.senderAvatar || !message.senderName)) {
        const userInfo = await getUserInfo(message.senderId);
        message.senderAvatar = userInfo.avatar;
        message.senderName = userInfo.nickname;
      }
      if (message.noteId) {
        common_vendor.index.navigateTo({ url: `/pages/travel-note/detail?id=${message.noteId}&tab=comment` });
      }
    };
    const openChat = (chat) => {
      if (chat.unreadCount > 0) {
        chat.unreadCount = 0;
        readStatusCache.value[1e3 + chat.id] = 0;
        saveReadStatusCache();
        updateUnreadCount();
      }
      common_vendor.index.navigateTo({
        url: `/pages/profile/chat?userId=${chat.userId}&nickname=${encodeURIComponent(chat.nickname || "")}&avatar=${encodeURIComponent(chat.avatar || "")}`
      });
    };
    const getEmptyIcon = () => {
      if (activeTab.value === "like")
        return "\u{1F44D}";
      if (activeTab.value === "comment")
        return "\u{1F4AC}";
      return "\u{1F48C}";
    };
    const getEmptyText = () => {
      if (activeTab.value === "like")
        return "\u6682\u65E0\u70B9\u8D5E\u6D88\u606F";
      if (activeTab.value === "comment")
        return "\u6682\u65E0\u8BC4\u8BBA\u6D88\u606F";
      return "\u6682\u65E0\u79C1\u4FE1";
    };
    const getEmptyTip = () => {
      if (activeTab.value === "like")
        return "\u6536\u5230\u70B9\u8D5E\u65F6\u4F1A\u5728\u8FD9\u91CC\u663E\u793A";
      if (activeTab.value === "comment")
        return "\u6536\u5230\u8BC4\u8BBA\u65F6\u4F1A\u5728\u8FD9\u91CC\u663E\u793A";
      return "\u5F00\u59CB\u4E0E\u597D\u53CB\u804A\u5929\u5427~";
    };
    const formatTime = (time) => {
      if (!time)
        return "";
      const date = new Date(time);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / (1e3 * 60));
      const hours = Math.floor(diff / (1e3 * 60 * 60));
      const days = Math.floor(diff / (1e3 * 60 * 60 * 24));
      if (minutes < 1)
        return "\u521A\u521A";
      if (minutes < 60)
        return `${minutes}\u5206\u949F\u524D`;
      if (hours < 24)
        return `${hours}\u5C0F\u65F6\u524D`;
      if (days === 1)
        return "\u6628\u5929";
      if (days < 7)
        return `${days}\u5929\u524D`;
      return `${date.getMonth() + 1}-${date.getDate()}`;
    };
    common_vendor.onMounted(() => {
      updateUnreadCount();
      loadMessages(true);
    });
    common_vendor.onShow(() => {
      if (messagesList.value.length > 0) {
        loadMessages(true);
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(tabs.value, (tab, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(tab.label),
            b: tab.unreadCount > 0
          }, tab.unreadCount > 0 ? {
            c: common_vendor.t(tab.unreadCount)
          } : {}, {
            d: tab.type,
            e: activeTab.value === tab.type ? 1 : "",
            f: common_vendor.o(($event) => switchTab(tab.type))
          });
        }),
        b: loading.value && messagesList.value.length === 0
      }, loading.value && messagesList.value.length === 0 ? {
        c: common_vendor.f(5, (i, k0, i0) => {
          return {
            a: i
          };
        })
      } : activeTab.value === "like" && messagesList.value.length > 0 ? {
        e: common_vendor.f(messagesList.value, (message, k0, i0) => {
          return common_vendor.e({
            a: message.senderAvatar || defaultAvatar,
            b: !message.isRead
          }, !message.isRead ? {} : {}, {
            c: common_vendor.t(message.senderName || "\u672A\u77E5\u7528\u6237"),
            d: common_vendor.t(formatTime(message.createTime)),
            e: common_vendor.t(message.noteTitle || "\u672A\u77E5\u6E38\u8BB0"),
            f: message.noteCover
          }, message.noteCover ? {
            g: message.noteCover
          } : {}, {
            h: message.id,
            i: !message.isRead ? 1 : "",
            j: common_vendor.o(($event) => viewLikeMessage(message))
          });
        })
      } : activeTab.value === "comment" && messagesList.value.length > 0 ? {
        g: common_vendor.f(messagesList.value, (message, k0, i0) => {
          return common_vendor.e({
            a: message.senderAvatar || defaultAvatar,
            b: !message.isRead
          }, !message.isRead ? {} : {}, {
            c: common_vendor.t(message.senderName || "\u533F\u540D\u7528\u6237"),
            d: common_vendor.t(formatTime(message.createTime)),
            e: common_vendor.t(message.content || "\u8BC4\u8BBA\u4E86\u4F60\u7684\u6E38\u8BB0"),
            f: message.noteTitle
          }, message.noteTitle ? {
            g: common_vendor.t(message.noteTitle)
          } : {}, {
            h: message.id,
            i: !message.isRead ? 1 : "",
            j: common_vendor.o(($event) => viewCommentMessage(message))
          });
        })
      } : activeTab.value === "chat" && messagesList.value.length > 0 ? {
        i: common_vendor.f(messagesList.value, (chat, k0, i0) => {
          return common_vendor.e({
            a: chat.avatar || defaultAvatar,
            b: common_vendor.t(chat.nickname || "\u672A\u77E5\u7528\u6237"),
            c: common_vendor.t(formatTime(chat.lastMessageTime)),
            d: common_vendor.t(chat.lastMessage || "\u6682\u65E0\u6D88\u606F"),
            e: chat.unreadCount > 0
          }, chat.unreadCount > 0 ? {
            f: common_vendor.t(chat.unreadCount)
          } : {}, {
            g: chat.id,
            h: chat.unreadCount > 0 ? 1 : "",
            i: common_vendor.o(($event) => openChat(chat))
          });
        })
      } : !loading.value && messagesList.value.length === 0 ? {
        k: common_vendor.t(getEmptyIcon()),
        l: common_vendor.t(getEmptyText()),
        m: common_vendor.t(getEmptyTip())
      } : {}, {
        d: activeTab.value === "like" && messagesList.value.length > 0,
        f: activeTab.value === "comment" && messagesList.value.length > 0,
        h: activeTab.value === "chat" && messagesList.value.length > 0,
        j: !loading.value && messagesList.value.length === 0,
        n: hasMore.value && !loading.value && messagesList.value.length > 0
      }, hasMore.value && !loading.value && messagesList.value.length > 0 ? {} : {}, {
        o: !hasMore.value && messagesList.value.length > 0
      }, !hasMore.value && messagesList.value.length > 0 ? {} : {}, {
        p: refreshing.value,
        q: common_vendor.o(onRefresh),
        r: common_vendor.o(loadMore)
      });
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-65e71314"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/profile/messages.vue"]]);
wx.createPage(MiniProgramPage);
