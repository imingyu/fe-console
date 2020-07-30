Component({
    properties: {
        test: String,
        test2: Object,
    },
    created() {
        global.t2 = this;
    }
})