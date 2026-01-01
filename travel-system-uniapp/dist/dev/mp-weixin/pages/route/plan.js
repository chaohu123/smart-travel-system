"use strict";
var common_vendor = require("../../common/vendor.js");
var api_route = require("../../api/route.js");
var api_content = require("../../api/content.js");
var store_user = require("../../store/user.js");
var utils_storage = require("../../utils/storage.js");
require("../../utils/http.js");
require("../../utils/config.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const steps = [
      { label: "\u76EE\u7684\u5730", key: "destination" },
      { label: "\u65F6\u95F4\u4E0E\u6210\u5458", key: "timeAndCompanion" },
      { label: "\u504F\u597D", key: "preference" }
    ];
    const currentStep = common_vendor.ref(0);
    const showNlpInput = common_vendor.ref(false);
    const nlpText = common_vendor.ref("");
    const cityList = common_vendor.ref([]);
    const popularCities = common_vendor.ref([]);
    const selectedCity = common_vendor.ref(null);
    const destination = common_vendor.ref("");
    const startDate = common_vendor.ref("");
    const endDate = common_vendor.ref("");
    const minDate = common_vendor.ref(new Date().toISOString().split("T")[0]);
    const dateTips = common_vendor.ref("");
    const selectedCompanion = common_vendor.ref(1);
    const companionList = common_vendor.ref([
      { id: 1, name: "\u72EC\u884C", icon: "\u{1F6B6}" },
      { id: 2, name: "\u60C5\u4FA3", icon: "\u{1F491}" },
      { id: 3, name: "\u5BB6\u5EAD", icon: "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}" },
      { id: 4, name: "\u670B\u53CB", icon: "\u{1F465}" },
      { id: 5, name: "\u4EB2\u5B50", icon: "\u{1F468}\u200D\u{1F469}\u200D\u{1F466}" },
      { id: 6, name: "\u5E26\u8001\u4EBA", icon: "\u{1F474}" }
    ]);
    const selectedTags = common_vendor.ref([]);
    const tagList = common_vendor.ref([]);
    const relaxationValue = common_vendor.ref(50);
    const budgetValue = common_vendor.ref(50);
    const quickTags = common_vendor.ref([
      { id: 1, name: "\u5E26\u5A03\u51FA\u6E38", icon: "\u{1F476}" },
      { id: 2, name: "\u6DF1\u5EA6\u6444\u5F71", icon: "\u{1F4F7}" },
      { id: 3, name: "\u7279\u79CD\u5175\u884C\u7A0B", icon: "\u26A1" },
      { id: 4, name: "\u4F11\u95F2\u5EA6\u5047", icon: "\u{1F3D6}\uFE0F" },
      { id: 5, name: "\u7F8E\u98DF\u4E4B\u65C5", icon: "\u{1F35C}" },
      { id: 6, name: "\u6587\u5316\u63A2\u7D22", icon: "\u{1F3DB}\uFE0F" }
    ]);
    const selectedQuickTags = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const currentLoadingStep = common_vendor.ref(0);
    const loadingSteps = common_vendor.ref([
      "\u6B63\u5728\u5206\u6790\u60A8\u7684\u9700\u6C42...",
      "\u6B63\u5728\u5339\u914D\u6700\u4F73\u666F\u70B9...",
      "\u6B63\u5728\u4F18\u5316\u4EA4\u901A\u8DEF\u7EBF...",
      "\u6B63\u5728\u751F\u6210\u884C\u7A0B\u5B89\u6392...",
      "\u5373\u5C06\u5B8C\u6210..."
    ]);
    const store = store_user.useUserStore();
    const user = common_vendor.computed(() => store.state.profile);
    const dailySelections = common_vendor.ref([]);
    const showDatePicker = common_vendor.ref(false);
    const datePickerType = common_vendor.ref("start");
    const datePickerValue = common_vendor.ref([0, 0, 0]);
    const tempSelectedDate = common_vendor.ref("");
    const yearList = common_vendor.computed(() => {
      const currentYear = new Date().getFullYear();
      const years = [];
      for (let i = currentYear - 10; i <= currentYear + 10; i++) {
        years.push(i);
      }
      return years;
    });
    const monthList = common_vendor.computed(() => {
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    });
    const dayList = common_vendor.computed(() => {
      const yearIndex = datePickerValue.value[0];
      const monthIndex = datePickerValue.value[1];
      const year = yearList.value[yearIndex];
      const month = monthList.value[monthIndex];
      const daysInMonth = new Date(year, month, 0).getDate();
      const days = [];
      const today = new Date();
      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth() + 1;
      const todayDay = today.getDate();
      let minDay = 1;
      if (year === todayYear && month === todayMonth) {
        minDay = todayDay;
      } else if (year < todayYear || year === todayYear && month < todayMonth) {
        minDay = daysInMonth + 1;
      }
      for (let i = minDay; i <= daysInMonth; i++) {
        days.push(i);
      }
      return days;
    });
    const showScenicScheduleModal = common_vendor.ref(false);
    const showFoodScheduleModal = common_vendor.ref(false);
    const currentScheduleItem = common_vendor.ref(null);
    const scenicTimeSlots = [
      { value: "morning", label: "\u4E0A\u5348", icon: "\u{1F305}" },
      { value: "afternoon", label: "\u4E0B\u5348", icon: "\u2600\uFE0F" },
      { value: "evening", label: "\u508D\u665A", icon: "\u{1F306}" },
      { value: "night", label: "\u665A\u4E0A", icon: "\u{1F319}" }
    ];
    const foodTimeSlots = [
      { value: "breakfast", label: "\u65E9\u9910", icon: "\u{1F305}" },
      { value: "lunch", label: "\u5348\u9910", icon: "\u2600\uFE0F" },
      { value: "dinner", label: "\u665A\u9910", icon: "\u{1F306}" },
      { value: "snack", label: "\u5C0F\u5403", icon: "\u{1F361}" }
    ];
    const scenicScheduleForm = common_vendor.ref({ day: 1, timeSlot: "morning" });
    const foodScheduleForm = common_vendor.ref({ day: 1, timeSlot: "breakfast" });
    const allScenicSchedules = common_vendor.ref({});
    const allFoodSchedules = common_vendor.ref({});
    const selectorVisible = common_vendor.ref(false);
    const selectorTab = common_vendor.ref("pending");
    const selectorType = common_vendor.ref("scenic");
    const selectorDayIndex = common_vendor.ref(0);
    const selectorList = common_vendor.ref([]);
    const selectorTempSelected = common_vendor.ref([]);
    const favoriteScenics = common_vendor.ref([]);
    const favoriteFoods = common_vendor.ref([]);
    const allScenics = common_vendor.ref([]);
    const allFoods = common_vendor.ref([]);
    const pendingScenics = common_vendor.ref([]);
    const pendingFoods = common_vendor.ref([]);
    const tagColors = [
      "#3ba272",
      "#ff6b9d",
      "#ff9800",
      "#9c27b0",
      "#2196f3",
      "#f44336",
      "#00bcd4",
      "#ffc107"
    ];
    const travelDays = common_vendor.computed(() => {
      if (!startDate.value || !endDate.value)
        return 0;
      const start = new Date(startDate.value);
      const end = new Date(endDate.value);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24)) + 1;
      return diffDays;
    });
    const relaxationText = common_vendor.computed(() => {
      if (relaxationValue.value < 30)
        return "\u975E\u5E38\u8F7B\u677E";
      if (relaxationValue.value < 60)
        return "\u9002\u5EA6\u5B89\u6392";
      if (relaxationValue.value < 80)
        return "\u7D27\u51D1\u5145\u5B9E";
      return "\u6781\u9650\u6311\u6218";
    });
    const budgetText = common_vendor.computed(() => {
      if (budgetValue.value < 30)
        return "\u7ECF\u6D4E\u5B9E\u60E0";
      if (budgetValue.value < 60)
        return "\u4E2D\u7B49\u6D88\u8D39";
      if (budgetValue.value < 80)
        return "\u54C1\u8D28\u4EAB\u53D7";
      return "\u5962\u534E\u4F53\u9A8C";
    });
    const canGoNext = common_vendor.computed(() => {
      switch (currentStep.value) {
        case 0:
          return selectedCity.value !== null || destination.value.trim() !== "";
        case 1:
          return startDate.value !== "" && endDate.value !== "" && selectedCompanion.value > 0;
        case 2:
          return selectedTags.value.length > 0;
        default:
          return false;
      }
    });
    const selectorTitle = common_vendor.computed(() => {
      const dayText = `\u7B2C${selectorDayIndex.value + 1}\u5929`;
      const typeText = selectorType.value === "scenic" ? "\u666F\u70B9" : "\u7F8E\u98DF";
      return `${dayText} - \u9009\u62E9${typeText}`;
    });
    const openDatePicker = (type) => {
      datePickerType.value = type;
      const currentDate = type === "start" ? startDate.value : endDate.value;
      const dateStr = currentDate || minDate.value;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth() + 1;
      const todayDay = today.getDate();
      if (dateStr) {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        let finalYear = year;
        let finalMonth = month;
        let finalDay = day;
        if (date < today) {
          finalYear = todayYear;
          finalMonth = todayMonth;
          finalDay = todayDay;
        }
        const yearIndex = yearList.value.findIndex((y) => y === finalYear);
        const monthIndex = monthList.value.findIndex((m) => m === finalMonth);
        datePickerValue.value = [
          yearIndex >= 0 ? yearIndex : 10,
          monthIndex >= 0 ? monthIndex : todayMonth - 1,
          0
        ];
        setTimeout(() => {
          const availableDays = dayList.value;
          if (availableDays.length > 0) {
            let dayIndex = availableDays.findIndex((d) => d >= finalDay);
            if (dayIndex < 0) {
              dayIndex = availableDays.length - 1;
            }
            datePickerValue.value[2] = dayIndex;
          } else {
            datePickerValue.value[2] = 0;
          }
        }, 0);
      } else {
        const yearIndex = yearList.value.findIndex((y) => y === todayYear);
        datePickerValue.value = [
          yearIndex >= 0 ? yearIndex : 10,
          todayMonth - 1,
          0
        ];
        setTimeout(() => {
          const availableDays = dayList.value;
          if (availableDays.length > 0) {
            const todayIndex = availableDays.findIndex((d) => d >= todayDay);
            datePickerValue.value[2] = todayIndex >= 0 ? todayIndex : 0;
          }
        }, 0);
      }
      showDatePicker.value = true;
    };
    const closeDatePicker = () => {
      showDatePicker.value = false;
      tempSelectedDate.value = "";
    };
    const onPickerViewChange = (e) => {
      const newValue = e.detail.value;
      datePickerValue.value = newValue;
      const yearIndex = newValue[0];
      const monthIndex = newValue[1];
      const dayIndex = newValue[2];
      const year = yearList.value[yearIndex];
      const month = monthList.value[monthIndex];
      const today = new Date();
      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth() + 1;
      const todayDay = today.getDate();
      const maxDays = new Date(year, month, 0).getDate();
      if (year === todayYear && month === todayMonth)
        ;
      else if (year < todayYear || year === todayYear && month < todayMonth) {
        const currentYearIndex = yearList.value.findIndex((y) => y === todayYear);
        const currentMonthIndex = todayMonth - 1;
        datePickerValue.value = [
          currentYearIndex >= 0 ? currentYearIndex : 10,
          currentMonthIndex,
          todayDay - 1
        ];
        return;
      }
      if (dayIndex >= maxDays) {
        datePickerValue.value[2] = maxDays - 1;
      }
      const availableDays = dayList.value;
      if (availableDays.length > 0 && dayIndex < availableDays.length) {
        const selectedDay = availableDays[dayIndex];
        if (year === todayYear && month === todayMonth && selectedDay < todayDay) {
          const todayIndex = availableDays.findIndex((d) => d >= todayDay);
          if (todayIndex >= 0) {
            datePickerValue.value[2] = todayIndex;
          }
        }
      }
    };
    const confirmDatePicker = () => {
      const yearIndex = datePickerValue.value[0];
      const monthIndex = datePickerValue.value[1];
      const dayIndex = datePickerValue.value[2];
      const year = yearList.value[yearIndex];
      const month = monthList.value[monthIndex];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth() + 1;
      const todayDay = today.getDate();
      new Date(year, month, 0).getDate();
      const availableDays = dayList.value;
      let actualDayIndex = dayIndex;
      if (availableDays.length > 0) {
        if (dayIndex >= availableDays.length) {
          actualDayIndex = availableDays.length - 1;
        }
        const selectedDay = availableDays[actualDayIndex];
        if (year < todayYear || year === todayYear && month < todayMonth || year === todayYear && month === todayMonth && selectedDay < todayDay) {
          common_vendor.index.showToast({
            title: "\u4E0D\u80FD\u9009\u62E9\u8FC7\u53BB\u7684\u65E5\u671F",
            icon: "none"
          });
          return;
        }
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
        onDatePickerChange({ detail: { value: dateStr } });
      } else {
        common_vendor.index.showToast({
          title: "\u4E0D\u80FD\u9009\u62E9\u8FC7\u53BB\u7684\u65E5\u671F",
          icon: "none"
        });
        return;
      }
      closeDatePicker();
    };
    const goToStep = (index) => {
      if (index <= currentStep.value) {
        currentStep.value = index;
      }
    };
    const nextStep = () => {
      if (!canGoNext.value) {
        common_vendor.index.showToast({
          title: "\u8BF7\u5B8C\u6210\u5F53\u524D\u6B65\u9AA4",
          icon: "none"
        });
        return;
      }
      if (currentStep.value < steps.length - 1) {
        currentStep.value++;
      } else {
        generateRoute();
      }
    };
    const prevStep = () => {
      if (currentStep.value > 0) {
        currentStep.value--;
      }
    };
    const selectCity = (city) => {
      selectedCity.value = city;
      destination.value = city.name;
    };
    const onDestinationInput = (e) => {
      destination.value = e.detail.value;
      selectedCity.value = null;
    };
    const onDatePickerChange = (e) => {
      const selectedDate = e.detail.value;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selected = new Date(selectedDate);
      selected.setHours(0, 0, 0, 0);
      if (selected < today) {
        common_vendor.index.showToast({
          title: "\u4E0D\u80FD\u9009\u62E9\u8FC7\u53BB\u7684\u65E5\u671F",
          icon: "none"
        });
        return;
      }
      if (datePickerType.value === "start") {
        if (!endDate.value || selectedDate <= endDate.value) {
          if (endDate.value) {
            const start = new Date(selectedDate);
            const end = new Date(endDate.value);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
            if (diffDays > 6) {
              common_vendor.index.showToast({
                title: "\u65C5\u6E38\u65E5\u671F\u8DE8\u5EA6\u4E0D\u80FD\u8D85\u8FC77\u5929",
                icon: "none"
              });
              return;
            }
          }
          startDate.value = selectedDate;
          updateDateTips();
          updateDailySelections();
        } else {
          common_vendor.index.showToast({
            title: "\u5F00\u59CB\u65E5\u671F\u4E0D\u80FD\u665A\u4E8E\u7ED3\u675F\u65E5\u671F",
            icon: "none"
          });
          return;
        }
      } else {
        if (!startDate.value) {
          common_vendor.index.showToast({
            title: "\u8BF7\u5148\u9009\u62E9\u5F00\u59CB\u65E5\u671F",
            icon: "none"
          });
          return;
        }
        if (selectedDate >= startDate.value) {
          const start = new Date(startDate.value);
          const end = new Date(selectedDate);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
          if (diffDays > 6) {
            common_vendor.index.showToast({
              title: "\u65C5\u6E38\u65E5\u671F\u8DE8\u5EA6\u4E0D\u80FD\u8D85\u8FC77\u5929",
              icon: "none"
            });
            return;
          }
          endDate.value = selectedDate;
          updateDateTips();
          updateDailySelections();
        } else {
          common_vendor.index.showToast({
            title: "\u7ED3\u675F\u65E5\u671F\u4E0D\u80FD\u65E9\u4E8E\u5F00\u59CB\u65E5\u671F",
            icon: "none"
          });
          return;
        }
      }
      closeDatePicker();
    };
    const updateDateTips = () => {
      if (!startDate.value) {
        dateTips.value = "";
        return;
      }
      const date = new Date(startDate.value);
      const month = date.getMonth() + 1;
      if (month >= 3 && month <= 5) {
        dateTips.value = "\u6625\u5B63\u662F\u65C5\u6E38\u7684\u597D\u65F6\u8282\uFF0C\u6C14\u5019\u5B9C\u4EBA";
      } else if (month >= 6 && month <= 8) {
        dateTips.value = "\u590F\u5B63\u65C5\u6E38\uFF0C\u6CE8\u610F\u9632\u6691\u964D\u6E29";
      } else if (month >= 9 && month <= 11) {
        dateTips.value = "\u79CB\u5B63\u98CE\u666F\u4F18\u7F8E\uFF0C\u9002\u5408\u51FA\u884C";
      } else {
        dateTips.value = "\u51AC\u5B63\u65C5\u6E38\uFF0C\u6CE8\u610F\u4FDD\u6696";
      }
    };
    const updateDailySelections = () => {
      const days = travelDays.value;
      if (days > 0) {
        while (dailySelections.value.length < days) {
          dailySelections.value.push({
            scenicIds: [],
            foodIds: [],
            scenicTimeSlots: {},
            foodTimeSlots: {}
          });
        }
        while (dailySelections.value.length > days) {
          dailySelections.value.pop();
        }
      }
    };
    const openScenicScheduleModal = (scenic) => {
      currentScheduleItem.value = scenic;
      if (allScenicSchedules.value[scenic.id]) {
        scenicScheduleForm.value = { ...allScenicSchedules.value[scenic.id] };
      } else {
        scenicScheduleForm.value = { day: 1, timeSlot: "morning" };
      }
      showScenicScheduleModal.value = true;
    };
    const closeScenicScheduleModal = () => {
      showScenicScheduleModal.value = false;
      currentScheduleItem.value = null;
    };
    const confirmScenicSchedule = () => {
      if (!currentScheduleItem.value)
        return;
      const scenicId = currentScheduleItem.value.id;
      const schedule = {
        day: scenicScheduleForm.value.day,
        timeSlot: scenicScheduleForm.value.timeSlot
      };
      allScenicSchedules.value[scenicId] = schedule;
      const dayIndex = scenicScheduleForm.value.day - 1;
      if (dailySelections.value[dayIndex]) {
        if (!dailySelections.value[dayIndex].scenicIds.includes(scenicId)) {
          dailySelections.value[dayIndex].scenicIds.push(scenicId);
        }
        dailySelections.value[dayIndex].scenicTimeSlots[scenicId] = schedule;
      }
      console.log("\u666F\u70B9\u65F6\u95F4\u6BB5\u5206\u914D:", {
        scenicId,
        schedule,
        allScenicSchedules: allScenicSchedules.value,
        dailySelections: dailySelections.value[dayIndex]
      });
      closeScenicScheduleModal();
      common_vendor.index.showToast({
        title: "\u5B89\u6392\u6210\u529F",
        icon: "success"
      });
    };
    const removeScenicSchedule = (scenicId) => {
      if (allScenicSchedules.value[scenicId]) {
        const schedule = allScenicSchedules.value[scenicId];
        const dayIndex = schedule.day - 1;
        if (dailySelections.value[dayIndex]) {
          const index = dailySelections.value[dayIndex].scenicIds.indexOf(scenicId);
          if (index > -1) {
            dailySelections.value[dayIndex].scenicIds.splice(index, 1);
          }
          delete dailySelections.value[dayIndex].scenicTimeSlots[scenicId];
        }
        delete allScenicSchedules.value[scenicId];
        common_vendor.index.showToast({
          title: "\u5DF2\u79FB\u9664",
          icon: "success"
        });
      }
    };
    const getScenicSchedule = (scenicId) => {
      return allScenicSchedules.value[scenicId] || null;
    };
    const getScenicScheduleText = (scenicId) => {
      const schedule = allScenicSchedules.value[scenicId];
      if (!schedule)
        return "";
      const timeSlot = scenicTimeSlots.find((s) => s.value === schedule.timeSlot);
      return `\u7B2C${schedule.day}\u5929 ${(timeSlot == null ? void 0 : timeSlot.label) || schedule.timeSlot}`;
    };
    const openFoodScheduleModal = (food) => {
      currentScheduleItem.value = food;
      if (allFoodSchedules.value[food.id]) {
        foodScheduleForm.value = { ...allFoodSchedules.value[food.id] };
      } else {
        foodScheduleForm.value = { day: 1, timeSlot: "breakfast" };
      }
      showFoodScheduleModal.value = true;
    };
    const closeFoodScheduleModal = () => {
      showFoodScheduleModal.value = false;
      currentScheduleItem.value = null;
    };
    const confirmFoodSchedule = () => {
      if (!currentScheduleItem.value)
        return;
      const foodId = currentScheduleItem.value.id;
      const schedule = {
        day: foodScheduleForm.value.day,
        timeSlot: foodScheduleForm.value.timeSlot
      };
      allFoodSchedules.value[foodId] = schedule;
      const dayIndex = foodScheduleForm.value.day - 1;
      if (dailySelections.value[dayIndex]) {
        if (!dailySelections.value[dayIndex].foodIds.includes(foodId)) {
          dailySelections.value[dayIndex].foodIds.push(foodId);
        }
        dailySelections.value[dayIndex].foodTimeSlots[foodId] = schedule;
      }
      console.log("\u7F8E\u98DF\u65F6\u95F4\u6BB5\u5206\u914D:", {
        foodId,
        schedule,
        allFoodSchedules: allFoodSchedules.value,
        dailySelections: dailySelections.value[dayIndex]
      });
      closeFoodScheduleModal();
      common_vendor.index.showToast({
        title: "\u5B89\u6392\u6210\u529F",
        icon: "success"
      });
    };
    const removeFoodSchedule = (foodId) => {
      if (allFoodSchedules.value[foodId]) {
        const schedule = allFoodSchedules.value[foodId];
        const dayIndex = schedule.day - 1;
        if (dailySelections.value[dayIndex]) {
          const index = dailySelections.value[dayIndex].foodIds.indexOf(foodId);
          if (index > -1) {
            dailySelections.value[dayIndex].foodIds.splice(index, 1);
          }
          delete dailySelections.value[dayIndex].foodTimeSlots[foodId];
        }
        delete allFoodSchedules.value[foodId];
        common_vendor.index.showToast({
          title: "\u5DF2\u79FB\u9664",
          icon: "success"
        });
      }
    };
    const getFoodSchedule = (foodId) => {
      return allFoodSchedules.value[foodId] || null;
    };
    const getFoodScheduleText = (foodId) => {
      const schedule = allFoodSchedules.value[foodId];
      if (!schedule)
        return "";
      const timeSlot = foodTimeSlots.find((s) => s.value === schedule.timeSlot);
      return `\u7B2C${schedule.day}\u5929 ${(timeSlot == null ? void 0 : timeSlot.label) || schedule.timeSlot}`;
    };
    const selectCompanion = (companionId) => {
      selectedCompanion.value = companionId;
    };
    const toggleTag = (tagId) => {
      const index = selectedTags.value.indexOf(tagId);
      if (index > -1) {
        selectedTags.value.splice(index, 1);
      } else {
        selectedTags.value.push(tagId);
      }
    };
    const toggleQuickTag = (tagId) => {
      const index = selectedQuickTags.value.indexOf(tagId);
      if (index > -1) {
        selectedQuickTags.value.splice(index, 1);
      } else {
        selectedQuickTags.value.push(tagId);
      }
    };
    const onRelaxationChange = (e) => {
      relaxationValue.value = e.detail.value;
    };
    const onBudgetChange = (e) => {
      budgetValue.value = e.detail.value;
    };
    const onNlpInput = (e) => {
      nlpText.value = e.detail.value;
    };
    const openNlpModal = () => {
      showNlpInput.value = true;
      nlpText.value = "";
    };
    const closeNlpModal = () => {
      showNlpInput.value = false;
    };
    const parseNlpText = () => {
      if (!nlpText.value.trim()) {
        common_vendor.index.showToast({
          title: "\u8BF7\u8F93\u5165\u60A8\u7684\u9700\u6C42",
          icon: "none"
        });
        return;
      }
      const text = nlpText.value;
      const cityMatch = text.match(/(去|到|前往)(.{1,10}?)(玩|旅游|旅行|游)/);
      if (cityMatch) {
        destination.value = cityMatch[2].trim();
      }
      const dayMatch = text.match(/(\d+)[日天]/);
      if (dayMatch) {
        const days = parseInt(dayMatch[1]);
        const today = new Date();
        startDate.value = today.toISOString().split("T")[0];
        const end = new Date(today);
        end.setDate(today.getDate() + days - 1);
        endDate.value = end.toISOString().split("T")[0];
        updateDailySelections();
      }
      const budgetMatch = text.match(/预算(\d+)/);
      if (budgetMatch) {
        const budget = parseInt(budgetMatch[1]);
        if (budget < 2e3)
          budgetValue.value = 20;
        else if (budget < 5e3)
          budgetValue.value = 50;
        else
          budgetValue.value = 80;
      }
      if (text.includes("\u5B89\u9759") || text.includes("\u4F11\u95F2")) {
        relaxationValue.value = 20;
      } else if (text.includes("\u7D27\u51D1") || text.includes("\u7279\u79CD\u5175")) {
        relaxationValue.value = 90;
      }
      if (text.includes("\u5E26\u5A03") || text.includes("\u4EB2\u5B50")) {
        selectedCompanion.value = 5;
      } else if (text.includes("\u60C5\u4FA3")) {
        selectedCompanion.value = 2;
      }
      showNlpInput.value = false;
      common_vendor.index.showToast({
        title: "\u89E3\u6790\u5B8C\u6210",
        icon: "success"
      });
      setTimeout(() => {
        if (currentStep.value === 0 && destination.value) {
          nextStep();
        }
      }, 500);
    };
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const weekdays = ["\u5468\u65E5", "\u5468\u4E00", "\u5468\u4E8C", "\u5468\u4E09", "\u5468\u56DB", "\u5468\u4E94", "\u5468\u516D"];
      const weekday = weekdays[date.getDay()];
      return `${month}\u6708${day}\u65E5(${weekday})`;
    };
    const extractCityFromDestination = (dest) => {
      const cleaned = dest.replace(/\d+[日天]游?/g, "").trim();
      return cleaned || dest;
    };
    const findCityId = (cityName) => {
      const city = cityList.value.find(
        (c) => c.name.includes(cityName) || cityName.includes(c.name)
      );
      return city ? city.id : null;
    };
    const generateRoute = async () => {
      var _a;
      if (!canGoNext.value) {
        common_vendor.index.showToast({
          title: "\u8BF7\u5B8C\u6210\u6240\u6709\u5FC5\u586B\u9879",
          icon: "none"
        });
        return;
      }
      common_vendor.index.hideLoading();
      loading.value = true;
      currentLoadingStep.value = 0;
      const stepInterval = setInterval(() => {
        if (currentLoadingStep.value < loadingSteps.value.length - 1) {
          currentLoadingStep.value++;
        } else {
          clearInterval(stepInterval);
        }
      }, 1500);
      try {
        const cityName = extractCityFromDestination(destination.value);
        let cityId = ((_a = selectedCity.value) == null ? void 0 : _a.id) || findCityId(cityName);
        if (!cityId && cityList.value.length > 0) {
          cityId = cityList.value[0].id;
        }
        if (!cityId) {
          common_vendor.index.showToast({
            title: "\u672A\u627E\u5230\u5BF9\u5E94\u57CE\u5E02\uFF0C\u8BF7\u68C0\u67E5\u76EE\u7684\u5730\u8F93\u5165",
            icon: "none",
            duration: 2e3
          });
          loading.value = false;
          clearInterval(stepInterval);
          return;
        }
        let selectedDays = travelDays.value;
        if (selectedDays === 0) {
          selectedDays = 3;
        }
        if (!startDate.value || !endDate.value) {
          common_vendor.index.showToast({
            title: "\u8BF7\u9009\u62E9\u6E38\u73A9\u65F6\u95F4",
            icon: "none"
          });
          loading.value = false;
          clearInterval(stepInterval);
          return;
        }
        const companion = companionList.value.find((c) => c.id === selectedCompanion.value);
        const suitablePeople = companion ? companion.name : "\u72EC\u884C";
        const dailySelectionsData = dailySelections.value.map((day, index) => {
          const dayNum = index + 1;
          const scenicTimeSlots2 = [];
          if (allScenicSchedules.value) {
            Object.keys(allScenicSchedules.value).forEach((scenicIdStr) => {
              const scenicId = parseInt(scenicIdStr);
              const schedule = allScenicSchedules.value[scenicId];
              if (schedule && schedule.day === dayNum) {
                scenicTimeSlots2.push({
                  scenicId,
                  timeSlot: schedule.timeSlot
                });
              }
            });
          }
          if (day.scenicTimeSlots) {
            Object.keys(day.scenicTimeSlots).forEach((scenicIdStr) => {
              const scenicId = parseInt(scenicIdStr);
              const schedule = day.scenicTimeSlots[scenicId];
              if (schedule && schedule.day === dayNum && !scenicTimeSlots2.find((s) => s.scenicId === scenicId)) {
                scenicTimeSlots2.push({
                  scenicId,
                  timeSlot: schedule.timeSlot
                });
              }
            });
          }
          const foodTimeSlots2 = [];
          if (allFoodSchedules.value) {
            Object.keys(allFoodSchedules.value).forEach((foodIdStr) => {
              const foodId = parseInt(foodIdStr);
              const schedule = allFoodSchedules.value[foodId];
              if (schedule && schedule.day === dayNum) {
                foodTimeSlots2.push({
                  foodId,
                  timeSlot: schedule.timeSlot
                });
              }
            });
          }
          if (day.foodTimeSlots) {
            Object.keys(day.foodTimeSlots).forEach((foodIdStr) => {
              const foodId = parseInt(foodIdStr);
              const schedule = day.foodTimeSlots[foodId];
              if (schedule && schedule.day === dayNum && !foodTimeSlots2.find((f) => f.foodId === foodId)) {
                foodTimeSlots2.push({
                  foodId,
                  timeSlot: schedule.timeSlot
                });
              }
            });
          }
          const dayData = {
            day: dayNum,
            scenicIds: day.scenicIds || [],
            foodIds: day.foodIds || [],
            scenicTimeSlots: scenicTimeSlots2.length > 0 ? scenicTimeSlots2 : void 0,
            foodTimeSlots: foodTimeSlots2.length > 0 ? foodTimeSlots2 : void 0
          };
          if (scenicTimeSlots2.length > 0 || foodTimeSlots2.length > 0) {
            console.log(`\u7B2C${dayNum}\u5929\u7684\u65F6\u95F4\u6BB5\u5206\u914D:`, {
              scenicTimeSlots: scenicTimeSlots2,
              foodTimeSlots: foodTimeSlots2
            });
          }
          return dayData;
        });
        console.log("\u63D0\u4EA4\u7684dailySelections\u6570\u636E:", JSON.stringify(dailySelectionsData, null, 2));
        console.log("allScenicSchedules:", allScenicSchedules.value);
        console.log("allFoodSchedules:", allFoodSchedules.value);
        const res = await api_route.routeApi.generate({
          cityId,
          days: selectedDays,
          tagIds: selectedTags.value,
          suitablePeople,
          useAi: true,
          dailySelections: dailySelectionsData,
          startDate: startDate.value,
          endDate: endDate.value
        });
        clearInterval(stepInterval);
        currentLoadingStep.value = loadingSteps.value.length - 1;
        if (res.statusCode === 200 && res.data.code === 200) {
          const routeId = res.data.data.routeId;
          if (!routeId) {
            common_vendor.index.showToast({
              title: "\u8DEF\u7EBFID\u83B7\u53D6\u5931\u8D25",
              icon: "none"
            });
            loading.value = false;
            return;
          }
          common_vendor.index.showToast({
            title: "\u8DEF\u7EBF\u751F\u6210\u6210\u529F\uFF01",
            icon: "success",
            duration: 1500
          });
          loading.value = false;
          await new Promise((resolve) => setTimeout(resolve, 1500));
          const detailUrl = `/pages/itinerary/itinerary-detail?id=${encodeURIComponent(routeId)}`;
          console.log("[generateRoute] \u51C6\u5907\u8DF3\u8F6C\u5230\u8BE6\u60C5\u9875:", detailUrl);
          common_vendor.index.navigateTo({
            url: detailUrl,
            success: () => {
              console.log("[generateRoute] \u8DF3\u8F6C\u6210\u529F");
            },
            fail: (err) => {
              console.error("[generateRoute] navigateTo \u5931\u8D25:", err);
              common_vendor.index.redirectTo({
                url: detailUrl,
                fail: (redirectErr) => {
                  console.error("[generateRoute] redirectTo \u4E5F\u5931\u8D25:", redirectErr);
                  common_vendor.index.showToast({
                    title: "\u9875\u9762\u8DF3\u8F6C\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u5237\u65B0",
                    icon: "none",
                    duration: 3e3
                  });
                }
              });
            }
          });
        } else {
          common_vendor.index.showToast({
            title: res.data.msg || "\u751F\u6210\u5931\u8D25",
            icon: "none"
          });
          loading.value = false;
        }
      } catch (error) {
        console.error("[generateRoute] \u8BF7\u6C42\u9519\u8BEF:", error);
        if (error.statusCode === 504 || error.statusCode === 500 || error.statusCode === 502) {
          common_vendor.index.showToast({
            title: "\u670D\u52A1\u5668\u5904\u7406\u4E2D\uFF0C\u8BF7\u7A0D\u540E\u67E5\u770B\u7ED3\u679C",
            icon: "none",
            duration: 3e3
          });
        } else if (error.errMsg && error.errMsg.includes("timeout")) {
          common_vendor.index.showToast({
            title: "\u8BF7\u6C42\u8D85\u65F6\uFF0C\u8DEF\u7EBF\u53EF\u80FD\u6B63\u5728\u751F\u6210\u4E2D\uFF0C\u8BF7\u7A0D\u540E\u67E5\u770B",
            icon: "none",
            duration: 3e3
          });
        } else {
          common_vendor.index.showToast({
            title: error.message || "\u7F51\u7EDC\u9519\u8BEF\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5",
            icon: "none",
            duration: 2e3
          });
        }
        loading.value = false;
        clearInterval(stepInterval);
      }
    };
    const loadCities = async () => {
      try {
        const res = await api_content.cityApi.list();
        const response = res.data;
        if (res.statusCode === 200 && response.code === 200) {
          const cities = response.data || [];
          cityList.value = cities.map((city) => ({
            id: city.id,
            name: city.cityName || city.name,
            image: city.imageUrl,
            desc: city.description
          }));
          popularCities.value = cityList.value.slice(0, 6);
        }
      } catch (error) {
        console.error("\u52A0\u8F7D\u57CE\u5E02\u5217\u8868\u5931\u8D25", error);
      }
    };
    const loadTags = async () => {
      try {
        const res = await api_content.tagApi.list();
        const response = res.data;
        if (res.statusCode === 200 && response.code === 200) {
          const tags = response.data || [];
          tagList.value = tags.map((tag, index) => ({
            id: tag.id,
            name: tag.tagName || tag.name,
            color: tagColors[index % tagColors.length]
          }));
        }
      } catch (error) {
        console.error("\u52A0\u8F7D\u6807\u7B7E\u5217\u8868\u5931\u8D25", error);
        tagList.value = [];
      }
    };
    const getPendingCount = () => {
      if (selectorType.value === "scenic") {
        return pendingScenics.value.length;
      } else {
        return pendingFoods.value.length;
      }
    };
    const loadSelectorList = async () => {
      var _a, _b, _c, _d, _e;
      try {
        if (selectorTab.value === "pending") {
          if (selectorType.value === "scenic") {
            selectorList.value = pendingScenics.value;
          } else {
            selectorList.value = pendingFoods.value;
          }
        } else if (selectorTab.value === "favorite") {
          if (selectorType.value === "scenic") {
            if (favoriteScenics.value.length === 0) {
              const res = await api_content.scenicSpotApi.getMyFavorites(user.value.id);
              if (res.statusCode === 200 && res.data.code === 200) {
                favoriteScenics.value = (((_a = res.data.data) == null ? void 0 : _a.list) || []).map((item) => ({
                  id: item.id,
                  name: item.name
                }));
              }
            }
            selectorList.value = favoriteScenics.value;
          } else {
            if (favoriteFoods.value.length === 0) {
              const res = await api_content.foodApi.getMyFavorites(user.value.id);
              if (res.statusCode === 200 && res.data.code === 200) {
                favoriteFoods.value = (((_b = res.data.data) == null ? void 0 : _b.list) || []).map((item) => ({
                  id: item.id,
                  name: item.name
                }));
              }
            }
            selectorList.value = favoriteFoods.value;
          }
        } else {
          const cityName = extractCityFromDestination(destination.value);
          const cityId = ((_c = selectedCity.value) == null ? void 0 : _c.id) || findCityId(cityName);
          if (selectorType.value === "scenic") {
            if (allScenics.value.length === 0 || cityId) {
              const res = await api_content.scenicSpotApi.list({ cityId: cityId || void 0, pageSize: 100 });
              if (res.statusCode === 200 && res.data.code === 200) {
                allScenics.value = (((_d = res.data.data) == null ? void 0 : _d.list) || []).map((item) => ({
                  id: item.id,
                  name: item.name
                }));
              }
            }
            selectorList.value = allScenics.value;
          } else {
            if (allFoods.value.length === 0 || cityId) {
              const res = await api_content.foodApi.list({ cityId: cityId || void 0, pageSize: 100 });
              if (res.statusCode === 200 && res.data.code === 200) {
                allFoods.value = (((_e = res.data.data) == null ? void 0 : _e.list) || []).map((item) => ({
                  id: item.id,
                  name: item.name
                }));
              }
            }
            selectorList.value = allFoods.value;
          }
        }
      } catch (error) {
        console.error("\u52A0\u8F7D\u9009\u62E9\u5668\u5217\u8868\u5931\u8D25:", error);
        common_vendor.index.showToast({ title: "\u52A0\u8F7D\u5931\u8D25", icon: "none" });
      }
    };
    common_vendor.watch(selectorTab, () => {
      loadSelectorList();
    });
    const isSelected = (id) => {
      return selectorTempSelected.value.includes(id);
    };
    const toggleSelect = (id) => {
      const index = selectorTempSelected.value.indexOf(id);
      if (index > -1) {
        selectorTempSelected.value.splice(index, 1);
      } else {
        selectorTempSelected.value.push(id);
      }
    };
    const confirmSelection = () => {
      if (selectorType.value === "scenic") {
        dailySelections.value[selectorDayIndex.value].scenicIds = [...selectorTempSelected.value];
      } else {
        dailySelections.value[selectorDayIndex.value].foodIds = [...selectorTempSelected.value];
      }
      closeSelector();
      const count = selectorTempSelected.value.length;
      if (count > 0) {
        common_vendor.index.showToast({
          title: `\u5DF2\u6DFB\u52A0${count}\u9879\u5230\u7B2C${selectorDayIndex.value + 1}\u5929`,
          icon: "success",
          duration: 2e3
        });
      }
    };
    const closeSelector = () => {
      selectorVisible.value = false;
      selectorTempSelected.value = [];
    };
    const loadPendingAdditions = () => {
      const pendingAdditions = utils_storage.getCache("route_pending_additions");
      pendingScenics.value = [];
      pendingFoods.value = [];
      if (pendingAdditions && pendingAdditions.length > 0) {
        pendingAdditions.forEach((item) => {
          if (item.type === "scenic") {
            if (!pendingScenics.value.find((s) => s.id === item.id)) {
              pendingScenics.value.push({ id: item.id, name: item.name });
              if (!allScenics.value.find((s) => s.id === item.id)) {
                allScenics.value.push({ id: item.id, name: item.name });
              }
            }
          } else if (item.type === "food") {
            if (!pendingFoods.value.find((f) => f.id === item.id)) {
              pendingFoods.value.push({ id: item.id, name: item.name });
              if (!allFoods.value.find((f) => f.id === item.id)) {
                allFoods.value.push({ id: item.id, name: item.name });
              }
            }
          }
        });
      }
    };
    common_vendor.onMounted(() => {
      loadCities();
      loadTags();
      loadPendingAdditions();
    });
    common_vendor.onShow(() => {
      loadPendingAdditions();
    });
    return (_ctx, _cache) => {
      var _a, _b;
      return common_vendor.e({
        a: common_vendor.f(steps, (step, index, i0) => {
          return common_vendor.e({
            a: currentStep.value > index
          }, currentStep.value > index ? {} : {
            b: common_vendor.t(index + 1)
          }, {
            c: common_vendor.t(step.label),
            d: index,
            e: currentStep.value === index ? 1 : "",
            f: currentStep.value > index ? 1 : "",
            g: common_vendor.o(($event) => goToStep(index))
          });
        }),
        b: common_vendor.f(popularCities.value.slice(0, 4), (city, k0, i0) => {
          var _a2, _b2, _c;
          return common_vendor.e({
            a: city.image ? `url(${city.image})` : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            b: city.image ? "transparent" : "#667eea",
            c: common_vendor.t(city.name),
            d: common_vendor.t(city.desc || "\u70ED\u95E8\u65C5\u6E38\u57CE\u5E02"),
            e: ((_a2 = selectedCity.value) == null ? void 0 : _a2.id) === city.id
          }, ((_b2 = selectedCity.value) == null ? void 0 : _b2.id) === city.id ? {} : {}, {
            f: city.id,
            g: ((_c = selectedCity.value) == null ? void 0 : _c.id) === city.id ? 1 : "",
            h: common_vendor.o(($event) => selectCity(city))
          });
        }),
        c: common_vendor.o([($event) => destination.value = $event.detail.value, onDestinationInput]),
        d: destination.value,
        e: common_vendor.f(quickTags.value, (tag, k0, i0) => {
          return {
            a: common_vendor.t(tag.icon),
            b: common_vendor.t(tag.name),
            c: tag.id,
            d: selectedQuickTags.value.includes(tag.id) ? 1 : "",
            e: common_vendor.o(($event) => toggleQuickTag(tag.id))
          };
        }),
        f: common_vendor.o(openNlpModal),
        g: currentStep.value === 0,
        h: common_vendor.t(startDate.value ? formatDate(startDate.value) : "\u9009\u62E9\u5F00\u59CB\u65E5\u671F"),
        i: !startDate.value ? 1 : "",
        j: common_vendor.o(($event) => openDatePicker("start")),
        k: common_vendor.t(endDate.value ? formatDate(endDate.value) : "\u9009\u62E9\u7ED3\u675F\u65E5\u671F"),
        l: !endDate.value ? 1 : "",
        m: common_vendor.o(($event) => openDatePicker("end")),
        n: common_vendor.unref(travelDays) > 0
      }, common_vendor.unref(travelDays) > 0 ? {
        o: common_vendor.t(common_vendor.unref(travelDays)),
        p: common_vendor.t(common_vendor.unref(travelDays) - 1)
      } : {}, {
        q: dateTips.value
      }, dateTips.value ? {
        r: common_vendor.t(dateTips.value)
      } : {}, {
        s: common_vendor.f(companionList.value, (companion, k0, i0) => {
          return {
            a: common_vendor.t(companion.icon),
            b: common_vendor.t(companion.name),
            c: companion.id,
            d: selectedCompanion.value === companion.id ? 1 : "",
            e: common_vendor.o(($event) => selectCompanion(companion.id))
          };
        }),
        t: currentStep.value === 1,
        v: common_vendor.f(tagList.value, (tag, k0, i0) => {
          return {
            a: common_vendor.t(tag.name),
            b: tag.id,
            c: selectedTags.value.includes(tag.id) ? 1 : "",
            d: common_vendor.s(selectedTags.value.includes(tag.id) ? {
              backgroundColor: tag.color,
              borderColor: tag.color
            } : {}),
            e: common_vendor.o(($event) => toggleTag(tag.id))
          };
        }),
        w: common_vendor.t(common_vendor.unref(relaxationText)),
        x: relaxationValue.value,
        y: common_vendor.o(onRelaxationChange),
        z: common_vendor.t(common_vendor.unref(budgetText)),
        A: budgetValue.value,
        B: common_vendor.o(onBudgetChange),
        C: common_vendor.unref(travelDays) > 0 && (pendingScenics.value.length > 0 || pendingFoods.value.length > 0)
      }, common_vendor.unref(travelDays) > 0 && (pendingScenics.value.length > 0 || pendingFoods.value.length > 0) ? common_vendor.e({
        D: pendingScenics.value.length > 0
      }, pendingScenics.value.length > 0 ? {
        E: common_vendor.f(pendingScenics.value, (scenic, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(scenic.name),
            b: getScenicSchedule(scenic.id)
          }, getScenicSchedule(scenic.id) ? {
            c: common_vendor.t(getScenicScheduleText(scenic.id))
          } : {}, {
            d: common_vendor.o(($event) => openScenicScheduleModal(scenic)),
            e: getScenicSchedule(scenic.id)
          }, getScenicSchedule(scenic.id) ? {
            f: common_vendor.o(($event) => removeScenicSchedule(scenic.id))
          } : {}, {
            g: scenic.id
          });
        })
      } : {}, {
        F: pendingFoods.value.length > 0
      }, pendingFoods.value.length > 0 ? {
        G: common_vendor.f(pendingFoods.value, (food, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(food.name),
            b: getFoodSchedule(food.id)
          }, getFoodSchedule(food.id) ? {
            c: common_vendor.t(getFoodScheduleText(food.id))
          } : {}, {
            d: common_vendor.o(($event) => openFoodScheduleModal(food)),
            e: getFoodSchedule(food.id)
          }, getFoodSchedule(food.id) ? {
            f: common_vendor.o(($event) => removeFoodSchedule(food.id))
          } : {}, {
            g: food.id
          });
        })
      } : {}) : {}, {
        H: currentStep.value === 2,
        I: currentStep.value > 0
      }, currentStep.value > 0 ? {
        J: common_vendor.o(prevStep)
      } : {}, {
        K: common_vendor.t(currentStep.value === steps.length - 1 ? "\u5F00\u59CB\u667A\u80FD\u89C4\u5212" : "\u4E0B\u4E00\u6B65"),
        L: !common_vendor.unref(canGoNext) ? 1 : "",
        M: common_vendor.o(nextStep),
        N: showDatePicker.value
      }, showDatePicker.value ? {
        O: common_vendor.o(closeDatePicker),
        P: common_vendor.t(datePickerType.value === "start" ? "\u9009\u62E9\u5F00\u59CB\u65E5\u671F" : "\u9009\u62E9\u7ED3\u675F\u65E5\u671F"),
        Q: common_vendor.o(confirmDatePicker),
        R: common_vendor.f(common_vendor.unref(yearList), (year, index, i0) => {
          return {
            a: common_vendor.t(year),
            b: index
          };
        }),
        S: common_vendor.f(common_vendor.unref(monthList), (month, index, i0) => {
          return {
            a: common_vendor.t(month),
            b: index
          };
        }),
        T: common_vendor.f(common_vendor.unref(dayList), (day, index, i0) => {
          return {
            a: common_vendor.t(day),
            b: index
          };
        }),
        U: datePickerValue.value,
        V: common_vendor.o(onPickerViewChange),
        W: common_vendor.o(() => {
        }),
        X: common_vendor.o(closeDatePicker)
      } : {}, {
        Y: showScenicScheduleModal.value
      }, showScenicScheduleModal.value ? {
        Z: common_vendor.o(closeScenicScheduleModal),
        aa: common_vendor.t((_a = currentScheduleItem.value) == null ? void 0 : _a.name),
        ab: common_vendor.f(common_vendor.unref(travelDays), (day, k0, i0) => {
          return {
            a: common_vendor.t(day),
            b: day,
            c: scenicScheduleForm.value.day === day ? 1 : "",
            d: common_vendor.o(($event) => scenicScheduleForm.value.day = day)
          };
        }),
        ac: common_vendor.f(scenicTimeSlots, (slot, k0, i0) => {
          return {
            a: common_vendor.t(slot.icon),
            b: common_vendor.t(slot.label),
            c: slot.value,
            d: scenicScheduleForm.value.timeSlot === slot.value ? 1 : "",
            e: common_vendor.o(($event) => scenicScheduleForm.value.timeSlot = slot.value)
          };
        }),
        ad: common_vendor.o(closeScenicScheduleModal),
        ae: common_vendor.o(confirmScenicSchedule),
        af: common_vendor.o(() => {
        }),
        ag: common_vendor.o(closeScenicScheduleModal)
      } : {}, {
        ah: showFoodScheduleModal.value
      }, showFoodScheduleModal.value ? {
        ai: common_vendor.o(closeFoodScheduleModal),
        aj: common_vendor.t((_b = currentScheduleItem.value) == null ? void 0 : _b.name),
        ak: common_vendor.f(common_vendor.unref(travelDays), (day, k0, i0) => {
          return {
            a: common_vendor.t(day),
            b: day,
            c: foodScheduleForm.value.day === day ? 1 : "",
            d: common_vendor.o(($event) => foodScheduleForm.value.day = day)
          };
        }),
        al: common_vendor.f(foodTimeSlots, (slot, k0, i0) => {
          return {
            a: common_vendor.t(slot.icon),
            b: common_vendor.t(slot.label),
            c: slot.value,
            d: foodScheduleForm.value.timeSlot === slot.value ? 1 : "",
            e: common_vendor.o(($event) => foodScheduleForm.value.timeSlot = slot.value)
          };
        }),
        am: common_vendor.o(closeFoodScheduleModal),
        an: common_vendor.o(confirmFoodSchedule),
        ao: common_vendor.o(() => {
        }),
        ap: common_vendor.o(closeFoodScheduleModal)
      } : {}, {
        aq: showNlpInput.value
      }, showNlpInput.value ? {
        ar: common_vendor.o(closeNlpModal),
        as: common_vendor.o([($event) => nlpText.value = $event.detail.value, onNlpInput]),
        at: showNlpInput.value,
        av: nlpText.value,
        aw: common_vendor.o(parseNlpText),
        ax: common_vendor.o(() => {
        }),
        ay: common_vendor.o(closeNlpModal)
      } : {}, {
        az: loading.value
      }, loading.value ? {
        aA: common_vendor.f(loadingSteps.value, (step, index, i0) => {
          return {
            a: common_vendor.t(currentLoadingStep.value > index ? "\u2713" : "\u25CB"),
            b: common_vendor.t(step),
            c: index,
            d: currentLoadingStep.value === index ? 1 : ""
          };
        })
      } : {}, {
        aB: selectorVisible.value
      }, selectorVisible.value ? common_vendor.e({
        aC: common_vendor.t(common_vendor.unref(selectorTitle)),
        aD: common_vendor.o(closeSelector),
        aE: getPendingCount() > 0
      }, getPendingCount() > 0 ? {
        aF: common_vendor.t(getPendingCount())
      } : {}, {
        aG: selectorTab.value === "pending" ? 1 : "",
        aH: common_vendor.o(($event) => selectorTab.value = "pending"),
        aI: selectorTab.value === "favorite" ? 1 : "",
        aJ: common_vendor.o(($event) => selectorTab.value = "favorite"),
        aK: selectorTab.value === "all" ? 1 : "",
        aL: common_vendor.o(($event) => selectorTab.value = "all"),
        aM: common_vendor.f(selectorList.value, (item, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(item.name),
            b: isSelected(item.id)
          }, isSelected(item.id) ? {} : {}, {
            c: item.id,
            d: isSelected(item.id) ? 1 : "",
            e: common_vendor.o(($event) => toggleSelect(item.id))
          });
        }),
        aN: selectorList.value.length === 0
      }, selectorList.value.length === 0 ? {} : {}, {
        aO: common_vendor.o(confirmSelection),
        aP: common_vendor.o(() => {
        }),
        aQ: common_vendor.o(closeSelector)
      }) : {});
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-f6d30d9a"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/route/plan.vue"]]);
wx.createPage(MiniProgramPage);
