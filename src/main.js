import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import { store } from './entities/store.js'
import './style.css'

store.initAuth()

createApp(App).use(router).mount('#app')
