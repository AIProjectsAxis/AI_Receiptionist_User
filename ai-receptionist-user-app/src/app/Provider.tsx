'use client'
import React from 'react'
import { Provider as ReduxProvider } from 'react-redux'
import { store } from '@/lib/Redux/store/store'
import LayoutAuth from './LayoutAuth'

type Props = {
  children: React.ReactNode
}

const ProviderAuth = ({children}: Props) => {
  return (
    <ReduxProvider store={store}>
      <LayoutAuth>
        {children}
      </LayoutAuth>
    </ReduxProvider>
  )
}

export default ProviderAuth