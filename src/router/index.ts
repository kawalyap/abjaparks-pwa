import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'pos.collect',
      component: () => import('@/views/PosCollectionView.vue'),
      meta: { title: 'Ticket Collection' }
    },
    {
      path: '/processing',
      name: 'pos.processing',
      component: () => import('@/views/ProcessingView.vue'),
      meta: { title: 'Payment Processing' }
    },
    {
      path: '/receipt',
      name: 'pos.receipt',
      component: () => import('@/views/ReceiptView.vue'),
      meta: { title: 'Official Receipt' }
    },
    {
      path: '/history',
      name: 'pos.history',
      component: () => import('@/views/HistoryView.vue'),
      meta: { title: 'Shift History' }
    },
    {
      path: '/reports',
      name: 'pos.reports',
      component: () => import('@/views/ReportsView.vue'),
      meta: { title: 'Shift Reports' }
    },
    {
      path: '/login',
      name: 'pos.login',
      component: () => import('@/views/LoginView.vue'),
      meta: { title: 'Agent Login' }
    },
    {
      path: '/receipt/:receiptNumber',
      name: 'pos.public-receipt',
      component: () => import('@/views/PublicReceiptView.vue'),
      meta: { title: 'E-Receipt' }
    }
  ]
})

router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || 'Abja Parks'} | Abja Parks POS`
  next()
})

// Strict Navigation Guard: Authenticate Attendants Before Allowing Shift Operations
router.beforeEach((to, _from, next) => {
  // Public routes: Login and Customer Public E-Receipt
  if (to.name === 'pos.login' || to.name === 'pos.public-receipt') {
    next()
    return
  }

  // Check persisted POS shift session
  let isAuthenticated = false
  try {
    const raw = localStorage.getItem('abja_pos_session')
    if (raw) {
      const sess = JSON.parse(raw)
      isAuthenticated = sess?.isLoggedIn === true && !!sess?.token
    }
  } catch {
    isAuthenticated = false
  }

  if (!isAuthenticated) {
    next({ name: 'pos.login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
