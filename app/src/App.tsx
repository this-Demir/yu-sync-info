import Visualizer from './pages/Visualizer'
import Docs from './pages/Docs'
import Media from './pages/Media'
import MobileTabBar from './components/layout/MobileTabBar'
import { useRouteStore } from './store/useRouteStore'
import './index.css'

function App() {
  const currentPage = useRouteStore(state => state.currentPage);

  return (
    <>
      {currentPage === 'docs' && <Docs />}
      {currentPage === 'simulator' && <Visualizer />}
      {currentPage === 'media' && <Media />}
      <MobileTabBar />
    </>
  )
}

export default App
