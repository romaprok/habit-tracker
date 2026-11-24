import { BrowserRouter, Route, Routes } from 'react-router'

import { Layout } from './components/Layout.tsx'
import { EditHabitPage } from './pages/EditHabitPage.tsx'
import { HabitsPage } from './pages/HabitsPage.tsx'
import { NewHabitPage } from './pages/NewHabitPage.tsx'
import { NotFoundPage } from './pages/NotFoundPage.tsx'
import { TodayPage } from './pages/TodayPage.tsx'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<TodayPage />} />
          <Route path="habits" element={<HabitsPage />} />
          <Route path="habits/new" element={<NewHabitPage />} />
          <Route path="habits/:id/edit" element={<EditHabitPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
