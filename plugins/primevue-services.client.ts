import { defineNuxtPlugin } from '#app'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'
import ConfirmDialog from 'primevue/confirmdialog'
import Toast from 'primevue/toast'

export default defineNuxtPlugin((nuxtApp) => {
  // Register Services
  nuxtApp.vueApp.use(ConfirmationService)
  nuxtApp.vueApp.use(ToastService)

  // Register Components globally
  nuxtApp.vueApp.component('ConfirmDialog', ConfirmDialog)
  nuxtApp.vueApp.component('Toast', Toast)
})
