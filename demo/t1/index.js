Component({
    properties: {
        test: String,
        test2: Object,
    },
    created() {
        global.t1 = this;
    }
})