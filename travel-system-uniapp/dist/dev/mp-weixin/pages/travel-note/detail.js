"use strict";
var common_vendor = require("../../common/vendor.js");
var api_content = require("../../api/content.js");
var store_user = require("../../store/user.js");
require("../../utils/http.js");
require("../../utils/storage.js");
if (!Array) {
  const _component_CloseSmall = common_vendor.resolveComponent("CloseSmall");
  _component_CloseSmall();
}
if (!Math) {
  LoginPrompt();
}
const LoginPrompt = () => "../../components/LoginPrompt.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const store = store_user.useUserStore();
    const user = common_vendor.computed(() => store.state.profile);
    const noteId = common_vendor.ref(null);
    const noteDetail = common_vendor.ref(null);
    const isLiked = common_vendor.ref(false);
    const isFavorite = common_vendor.ref(false);
    const comments = common_vendor.ref([]);
    const commentEditorVisible = common_vendor.ref(false);
    const commentContent = common_vendor.ref("");
    const submitting = common_vendor.ref(false);
    const showLoginPrompt = common_vendor.ref(false);
    const textareaFocus = common_vendor.ref(false);
    const commentCount = common_vendor.computed(() => {
      var _a, _b;
      if (((_b = (_a = noteDetail.value) == null ? void 0 : _a.note) == null ? void 0 : _b.commentCount) !== void 0 && noteDetail.value.note.commentCount !== null) {
        return noteDetail.value.note.commentCount;
      }
      return comments.value.length || 0;
    });
    const coverImage = common_vendor.computed(() => {
      var _a;
      if (((_a = noteDetail.value) == null ? void 0 : _a.images) && noteDetail.value.images.length > 0) {
        return noteDetail.value.images[0].url;
      }
      return null;
    });
    const authorAvatar = common_vendor.computed(() => {
      var _a, _b, _c, _d;
      if ((_b = (_a = noteDetail.value) == null ? void 0 : _a.author) == null ? void 0 : _b.avatar) {
        return noteDetail.value.author.avatar;
      }
      if ((_d = (_c = noteDetail.value) == null ? void 0 : _c.note) == null ? void 0 : _d.authorAvatar) {
        return noteDetail.value.note.authorAvatar;
      }
      return "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200";
    });
    const authorName = common_vendor.computed(() => {
      var _a, _b, _c, _d, _e, _f;
      if ((_b = (_a = noteDetail.value) == null ? void 0 : _a.author) == null ? void 0 : _b.nickname) {
        return noteDetail.value.author.nickname;
      }
      if ((_d = (_c = noteDetail.value) == null ? void 0 : _c.note) == null ? void 0 : _d.authorName) {
        return noteDetail.value.note.authorName;
      }
      return `\u7528\u6237${((_f = (_e = noteDetail.value) == null ? void 0 : _e.note) == null ? void 0 : _f.userId) || ""}`;
    });
    const previewImage = (index) => {
      var _a;
      if (!((_a = noteDetail.value) == null ? void 0 : _a.images))
        return;
      const urls = noteDetail.value.images.map((img) => img.url);
      common_vendor.index.previewImage({
        current: typeof index === "string" ? parseInt(index) : index,
        urls
      });
    };
    const showLoginPromptDialog = () => {
      console.log("showLoginPromptDialog called");
      common_vendor.index.showModal({
        title: "\u9700\u8981\u767B\u5F55",
        content: "\u8BF7\u5148\u767B\u5F55",
        confirmText: "\u53BB\u767B\u5F55",
        cancelText: "\u53D6\u6D88",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.switchTab({ url: "/pages/profile/profile" });
          }
        }
      });
    };
    const handleLoginConfirm = () => {
      showLoginPrompt.value = false;
    };
    const handleLoginCancel = () => {
      showLoginPrompt.value = false;
    };
    const toggleLike = async () => {
      var _a;
      console.log("toggleLike called", noteId.value);
      if (!noteId.value)
        return;
      try {
        if (!user.value) {
          console.log("User not logged in, showing login prompt");
          showLoginPromptDialog();
          return;
        }
        console.log("Toggling like for note:", noteId.value, "current state:", isLiked.value);
        const res = await api_content.travelNoteInteractionApi.toggleLike(user.value.id, noteId.value);
        const data = res.data;
        if (res.statusCode === 200 && data.code === 200) {
          isLiked.value = data.data.isLiked;
          if ((_a = noteDetail.value) == null ? void 0 : _a.note) {
            if (data.data.likeCount !== void 0) {
              noteDetail.value.note.likeCount = data.data.likeCount;
            } else {
              noteDetail.value.note.likeCount = data.data.isLiked ? (noteDetail.value.note.likeCount || 0) + 1 : Math.max((noteDetail.value.note.likeCount || 0) - 1, 0);
            }
          }
          common_vendor.index.showToast({
            title: data.data.isLiked ? "\u70B9\u8D5E\u6210\u529F" : "\u53D6\u6D88\u70B9\u8D5E",
            icon: "success"
          });
        } else {
          common_vendor.index.showToast({
            title: data.msg || "\u64CD\u4F5C\u5931\u8D25",
            icon: "none"
          });
        }
      } catch (error) {
        console.error("\u70B9\u8D5E\u5931\u8D25:", error);
        common_vendor.index.showToast({
          title: (error == null ? void 0 : error.message) || "\u64CD\u4F5C\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC",
          icon: "none"
        });
      }
    };
    const toggleFavorite = async () => {
      var _a;
      console.log("toggleFavorite called", noteId.value);
      if (!noteId.value)
        return;
      try {
        if (!user.value) {
          console.log("User not logged in, showing login prompt");
          showLoginPromptDialog();
          return;
        }
        console.log("Toggling favorite for note:", noteId.value, "current state:", isFavorite.value);
        const res = await api_content.travelNoteInteractionApi.toggleFavorite(user.value.id, noteId.value);
        const data = res.data;
        if (res.statusCode === 200 && data.code === 200) {
          isFavorite.value = data.data.isFavorite;
          if (data.data.favoriteCount !== void 0 && ((_a = noteDetail.value) == null ? void 0 : _a.note)) {
            noteDetail.value.note.favoriteCount = data.data.favoriteCount;
          }
          common_vendor.index.showToast({
            title: isFavorite.value ? "\u6536\u85CF\u6210\u529F" : "\u53D6\u6D88\u6536\u85CF",
            icon: "success"
          });
        } else {
          common_vendor.index.showToast({
            title: data.msg || "\u64CD\u4F5C\u5931\u8D25",
            icon: "none"
          });
        }
      } catch (error) {
        console.error("\u6536\u85CF\u5931\u8D25:", error);
        common_vendor.index.showToast({
          title: (error == null ? void 0 : error.message) || "\u64CD\u4F5C\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC",
          icon: "none"
        });
      }
    };
    const openCommentEditor = () => {
      console.log("openCommentEditor called");
      if (!user.value) {
        console.log("User not logged in, showing login prompt");
        showLoginPromptDialog();
        return;
      }
      console.log("Opening comment editor");
      textareaFocus.value = false;
      commentContent.value = "";
      commentEditorVisible.value = true;
      common_vendor.nextTick(() => {
        setTimeout(() => {
          textareaFocus.value = true;
        }, 300);
      });
    };
    const handleTextareaTap = (e) => {
      if (e) {
        e.stopPropagation();
      }
      textareaFocus.value = false;
      common_vendor.nextTick(() => {
        textareaFocus.value = true;
      });
    };
    const closeCommentEditor = () => {
      if (submitting.value)
        return;
      textareaFocus.value = false;
      commentEditorVisible.value = false;
      commentContent.value = "";
    };
    const submitComment = async () => {
      var _a, _b;
      if (!noteId.value)
        return;
      if (!commentContent.value.trim()) {
        common_vendor.index.showToast({ title: "\u8BF7\u8F93\u5165\u8BC4\u8BBA\u5185\u5BB9", icon: "none" });
        return;
      }
      if (!user.value) {
        closeCommentEditor();
        showLoginPromptDialog();
        return;
      }
      submitting.value = true;
      try {
        const res = await api_content.travelNoteInteractionApi.publishComment({
          userId: user.value.id,
          contentType: "note",
          contentId: noteId.value,
          content: commentContent.value.trim()
        });
        const data = res.data;
        if (res.statusCode === 200 && data.code === 200) {
          common_vendor.index.showToast({ title: "\u8BC4\u8BBA\u6210\u529F", icon: "success" });
          commentContent.value = "";
          commentEditorVisible.value = false;
          await loadComments();
          if ((_a = noteDetail.value) == null ? void 0 : _a.note) {
            if (((_b = data.data) == null ? void 0 : _b.commentCount) !== void 0) {
              noteDetail.value.note.commentCount = data.data.commentCount;
            } else {
              noteDetail.value.note.commentCount = (noteDetail.value.note.commentCount || 0) + 1;
            }
          }
        } else {
          common_vendor.index.showToast({ title: data.msg || "\u8BC4\u8BBA\u5931\u8D25", icon: "none" });
        }
      } catch (error) {
        console.error("\u8BC4\u8BBA\u5931\u8D25:", error);
        common_vendor.index.showToast({
          title: (error == null ? void 0 : error.message) || "\u7F51\u7EDC\u9519\u8BEF\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u8FDE\u63A5",
          icon: "none"
        });
      } finally {
        submitting.value = false;
      }
    };
    const formatTime = (time) => {
      if (!time)
        return "";
      const date = new Date(time);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    };
    const loadDetail = async () => {
      var _a, _b, _c;
      if (!noteId.value)
        return;
      try {
        const res = await api_content.travelNoteApi.getDetail(noteId.value, (_a = user.value) == null ? void 0 : _a.id);
        const data = res.data;
        if (res.statusCode === 200 && data.code === 200) {
          noteDetail.value = data.data;
          if (((_b = data.data) == null ? void 0 : _b.isFavorite) !== void 0) {
            isFavorite.value = data.data.isFavorite;
          }
          if (((_c = data.data) == null ? void 0 : _c.isLiked) !== void 0) {
            isLiked.value = data.data.isLiked;
          }
        } else {
          common_vendor.index.showToast({
            title: "\u52A0\u8F7D\u5931\u8D25",
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.showToast({
          title: "\u7F51\u7EDC\u9519\u8BEF",
          icon: "none"
        });
      }
    };
    const loadComments = async () => {
      if (!noteId.value)
        return;
      try {
        const res = await api_content.travelNoteInteractionApi.listComments({
          contentType: "note",
          contentId: noteId.value,
          pageNum: 1,
          pageSize: 1e3
        });
        const data = res.data;
        if (res.statusCode === 200 && data.code === 200) {
          comments.value = (data.data || []).map((comment) => ({
            ...comment,
            nickname: comment.nickname || comment.userName || comment.nick_name,
            avatar: comment.avatar || comment.userAvatar || comment.user_avatar
          }));
          console.log("\u8BC4\u8BBA\u5217\u8868\u52A0\u8F7D\u6210\u529F:", comments.value.length, "\u6761\u8BC4\u8BBA");
          if (comments.value.length > 0) {
            console.log("\u7B2C\u4E00\u6761\u8BC4\u8BBA\u6570\u636E:", comments.value[0]);
          }
        }
      } catch (error) {
        console.error("\u52A0\u8F7D\u8BC4\u8BBA\u5931\u8D25:", error);
      }
    };
    common_vendor.onMounted(() => {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const options = currentPage.options || {};
      const id = options.id;
      if (id) {
        noteId.value = typeof id === "string" ? parseInt(id) : id;
        if (noteId.value) {
          loadDetail();
          loadComments();
        }
      }
    });
    return (_ctx, _cache) => {
      var _a, _b, _c, _d, _e, _f;
      return common_vendor.e({
        a: common_vendor.o(handleLoginConfirm),
        b: common_vendor.o(handleLoginCancel),
        c: common_vendor.p({
          visible: showLoginPrompt.value
        }),
        d: noteDetail.value
      }, noteDetail.value ? common_vendor.e({
        e: common_vendor.unref(coverImage)
      }, common_vendor.unref(coverImage) ? {
        f: common_vendor.unref(coverImage),
        g: common_vendor.o(($event) => previewImage(0))
      } : {}, {
        h: common_vendor.t((_a = noteDetail.value.note) == null ? void 0 : _a.title),
        i: common_vendor.unref(authorAvatar),
        j: common_vendor.t(common_vendor.unref(authorName)),
        k: common_vendor.t(formatTime((_b = noteDetail.value.note) == null ? void 0 : _b.createTime)),
        l: common_vendor.t(((_c = noteDetail.value.note) == null ? void 0 : _c.viewCount) || 0),
        m: common_vendor.t((_d = noteDetail.value.note) == null ? void 0 : _d.content),
        n: noteDetail.value.images && noteDetail.value.images.length > 0
      }, noteDetail.value.images && noteDetail.value.images.length > 0 ? {
        o: common_vendor.f(noteDetail.value.images, (img, index, i0) => {
          return {
            a: img.url,
            b: common_vendor.o(($event) => previewImage(index)),
            c: index
          };
        })
      } : {}, {
        p: common_vendor.t(common_vendor.unref(commentCount)),
        q: common_vendor.f(comments.value, (comment, k0, i0) => {
          return {
            a: comment.avatar || common_vendor.unref(authorAvatar),
            b: common_vendor.t(comment.nickname || "\u533F\u540D\u7528\u6237"),
            c: common_vendor.t(comment.content),
            d: common_vendor.t(formatTime(comment.createTime)),
            e: comment.id
          };
        })
      }) : {}, {
        r: isLiked.value ? 1 : "",
        s: common_vendor.t(((_f = (_e = noteDetail.value) == null ? void 0 : _e.note) == null ? void 0 : _f.likeCount) || 0),
        t: isLiked.value ? 1 : "",
        v: common_vendor.o(toggleLike),
        w: isFavorite.value ? 1 : "",
        x: isFavorite.value ? 1 : "",
        y: common_vendor.o(toggleFavorite),
        z: common_vendor.t(common_vendor.unref(commentCount)),
        A: common_vendor.o(openCommentEditor),
        B: commentEditorVisible.value
      }, commentEditorVisible.value ? {
        C: common_vendor.o(closeCommentEditor),
        D: common_vendor.p({
          theme: "outline",
          size: "26",
          fill: "#8a94a3"
        }),
        E: textareaFocus.value,
        F: common_vendor.o(handleTextareaTap),
        G: common_vendor.o(handleTextareaTap),
        H: commentContent.value,
        I: common_vendor.o(($event) => commentContent.value = $event.detail.value),
        J: common_vendor.o(() => {
        }),
        K: common_vendor.t(commentContent.value.length),
        L: common_vendor.t(submitting.value ? "\u63D0\u4EA4\u4E2D..." : "\u53D1\u8868"),
        M: !commentContent.value.trim() || submitting.value,
        N: common_vendor.o(submitComment),
        O: common_vendor.o(() => {
        }),
        P: common_vendor.o(closeCommentEditor)
      } : {}, {
        Q: commentEditorVisible.value ? 1 : ""
      });
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-18791242"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/travel-note/detail.vue"]]);
wx.createPage(MiniProgramPage);
