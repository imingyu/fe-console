# fe-console

面向 h5、微信/支付宝/百度/字节跳动小程序的控制台辅助开发工具。

## 功能列表

-   [ ] 核心
    -   [ ] 仅监控数据，不负责数据渲染
    -   [ ] 可将监控数据实时发送到控制台
-   [ ] 控制台

    -   [ ] 以 pc 端 web 形式存在
    -   [ ] 实时以小程序端/h5 端的 UI 样式显示监控数据
    -   [ ] 可以做日志查看器应用

-   [ ] CLI
    -   [ ] 无需开发者手动安装 fe-console，仅通过 cli 工具进行安装和卸载
    -   [ ] 可以将 UI 代码插入小程序端/h5 端
    -   [ ] 可以将 UI 代码从小程序端/h5 端移除
-   [ ] 小程序端
    -   [ ] `Api`：监控 api 执行记录，并友好化显示其执行结果、状态、子任务（如 WebSocketTask）状态及数据
    -   [ ] `View`：树结构实时查看 App/Page/Component 实例对象及关系
    -   [ ] `Method`：监控 App/Page/Component 内的方法执行记录，并友好化显示其执行结果、状态、所在载体等数据
    -   [ ] `Event`：监控 Component 的事件触发与外部的 Page/Component 的监听记录，并友好化显示其数据及相关载体
    -   [ ] `Console`：监控`console`对象的相关方法执行，并友好化显示其数据
    -   [ ] `Storage`：查看及操作 Storage 数据
    -   [ ] `System`：查看系统数据，如：窗口大小、手机型号、网络状态等
-   [ ] H5 端

    -   [ ] `Network`：监控网络请求
    -   [ ] `Elements`：树结构实时查看 html 结构
    -   [ ] `Console`：监控`console`对象的相关方法执行，并友好化显示其数据
    -   [ ] `Storage`：查看及操作 Storage 数据
        -   [ ] `Local Storage`
        -   [ ] `Session Storage`
        -   [ ] `Cookies`
        -   [ ] `IndexedDB`
        -   [ ] `Web SQL`
        -   [ ] `Application Cache`
    -   [ ] `System`：查看系统数据，如：窗口大小、系统版本等

-   生产者只负责生产数据，其他一概不管
-   存储者负责保存数据，至于怎么保存，存在哪，存多久，看具体实现
-   存储者需要提供接口将保存的数据向外导出
