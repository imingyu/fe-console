export const ApiCategoryMap = {
    request: "xhr",
    downloadFile: "xhr",
    uploadFile: "xhr",
    createUDPSocket: "xhr",
    sendSocketMessage: "ws",
    onSocketOpen: "ws",
    onSocketMessage: "ws",
    onSocketError: "ws",
    onSocketClose: "ws",
    connectSocket: "ws",
    closeSocket: "ws",
    canIUse: "base",
    switchTab: "navigate",
    navigateBack: "navigate",
    navigateTo: "navigate",
    redirectTo: "navigate",
    reLaunch: "navigate",
    showToast: "ui",
    showModal: "ui",
    showLoading: "ui",
    showActionSheet: "ui",
    hideToast: "ui",
    hideLoading: "ui",
    nextTick: "ui",
    stopPullDownRefresh: "scroll",
    startPullDownRefresh: "scroll",
    pageScrollTo: "scroll",
    setStorageSync: "storage",
    setStorage: "storage",
    removeStorageSync: "storage",
    removeStorage: "storage",
    getStorageSync: "storage",
    getStorage: "storage",
    getStorageInfo: "storage",
    getStorageInfoSync: "storage",
    clearStorageSync: "storage",
    clearStorage: "storage",
    login: "user",
    checkSession: "user",
    getAccountInfoSync: "user",
    getUserProfile: "user",
    getUserInfo: "user",
    getLocation: "user",
    openLocation: "user",
};

export const ApiCategoryList = Object.keys(ApiCategoryMap)
    .reduce((sum, item) => {
        if (sum.indexOf(ApiCategoryMap[item]) === -1) {
            sum.push(ApiCategoryMap[item]);
        }
        return sum;
    }, [])
    .concat("other");
